"""Advisory orchestration service — grounding + generation + fallback."""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import cache_get, cache_set
from app.core.config import settings
from app.models.advisory import Advisory
from app.models.destination import Destination
from app.models.trip import Trip
from app.schemas.weather import WeatherSnapshot
from app.services.ai.base import AIProvider
from app.services.weather.base import WeatherProvider

logger = logging.getLogger(__name__)

DISCLAIMER = "AI-generated guidance — always confirm current conditions locally before travel."

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "packing_list": {"type": "array", "items": {"type": "string"}},
        "gear_checklist": {"type": "array", "items": {"type": "string"}},
        "safety_advisory": {"type": "string"},
        "safety_advisory_ur": {"type": "string"},
        "confidence": {"type": "string", "enum": ["high", "low"]},
        "missing_info_flags": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["packing_list", "gear_checklist", "safety_advisory", "confidence"],
}


class AdvisoryService:
    """Orchestrates weather fetch + LLM advisory generation with Groq/Gemini fallback."""

    def __init__(
        self,
        weather_provider: WeatherProvider,
        primary_ai: AIProvider,
        fallback_ai: AIProvider,
        db: AsyncSession,
    ):
        self.weather = weather_provider
        self.primary_ai = primary_ai
        self.fallback_ai = fallback_ai
        self.db = db

    async def generate_advisory(self, trip_id: int, bypass_cache: bool = False) -> Advisory:
        """Generate (or return cached) advisory for a given trip."""
        # --- Check advisory cache ---
        cache_key = f"advisory:{trip_id}"
        if not bypass_cache:
            cached = await cache_get(cache_key)
            if cached is not None:
                logger.info("Returning cached advisory for trip %s", trip_id)
                # Load from DB to return proper ORM object
                result = await self.db.execute(
                    select(Advisory).where(Advisory.id == cached["id"])
                )
                adv = result.scalar_one_or_none()
                if adv:
                    return adv

        # --- Load trip + destination ---
        result = await self.db.execute(
            select(Trip)
            .options(selectinload(Trip.destination).selectinload(Destination.places))
            .where(Trip.id == trip_id)
        )
        trip = result.scalar_one_or_none()
        if not trip:
            raise ValueError(f"Trip {trip_id} not found")

        dest: Destination = trip.destination

        # --- Fetch live weather ---
        weather_snapshot = await self.weather.get_forecast(dest.latitude, dest.longitude)

        # --- Build grounded prompt ---
        prompt = self._build_prompt(
            destination=dest,
            weather=weather_snapshot,
            trip=trip,
        )

        # --- Try primary AI, fall back to secondary ---
        ai_result: dict[str, Any] | None = None
        provider_used = "none"

        try:
            ai_result = await self.primary_ai.generate(prompt, RESPONSE_SCHEMA)
            provider_used = "groq"
        except Exception as exc:
            logger.warning("Primary AI (Groq) failed: %s — trying fallback", exc)

        if ai_result is None:
            try:
                ai_result = await self.fallback_ai.generate(prompt, RESPONSE_SCHEMA)
                provider_used = "gemini"
            except Exception as exc:
                logger.error("Fallback AI (Gemini) also failed: %s", exc)
                raise RuntimeError(
                    "Both AI providers are unavailable. Advisory generation failed."
                ) from exc

        logger.info("Advisory for trip %s served by %s", trip_id, provider_used)

        # --- Persist advisory ---
        advisory = Advisory(
            trip_id=trip_id,
            packing_list=ai_result.get("packing_list", []),
            gear_checklist=ai_result.get("gear_checklist", []),
            safety_advisory_text=ai_result.get("safety_advisory", ""),
            safety_advisory_text_ur=ai_result.get("safety_advisory_ur", ""),
            confidence=ai_result.get("confidence", "low"),
            source_weather_snapshot=weather_snapshot.model_dump(),
        )
        self.db.add(advisory)
        await self.db.flush()
        await self.db.refresh(advisory)

        # Cache advisory id for quick retrieval
        await cache_set(
            cache_key,
            {"id": advisory.id},
            ttl=settings.advisory_cache_ttl_seconds,
        )

        return advisory

    @staticmethod
    def _build_prompt(
        destination: Destination,
        weather: WeatherSnapshot,
        trip: Trip,
    ) -> str:
        lang_instruction = ""
        if trip.language == "ur":
            lang_instruction = (
                "\nAlso include a field 'safety_advisory_ur' which is the Urdu "
                "translation of the safety_advisory field.\n"
            )

        profile = trip.traveler_profile or {}
        selected_ids = {int(value) for value in profile.get("selected_place_ids", []) if str(value).isdigit()}
        selected_places = [place for place in destination.places if not selected_ids or place.id in selected_ids]
        places_context = "; ".join(
            f"{place.name} ({', '.join(place.activity_tags or [])})" for place in selected_places
        ) or "No attractions selected; tailor advice to the destination only."

        return (
            f"Destination: {destination.name}\n"
            f"Known hazards: {destination.known_hazards}\n\n"
            f"Trip dates: {trip.start_date} to {trip.end_date}\n"
            f"Traveler profile: {trip.traveler_profile}\n\n"
            f"Selected places and activities: {places_context}\n\n"
            f"Current weather at destination:\n"
            f"  Temperature: {weather.temperature_c}°C\n"
            f"  Wind speed: {weather.wind_speed_kmh} km/h\n"
            f"  Precipitation: {weather.precipitation_mm} mm\n"
            f"  Weather code: {weather.weather_code}\n"
            f"  Stale data: {weather.stale}\n\n"
            f"Generate a JSON object with these fields:\n"
            f"  packing_list: array of strings (items to pack)\n"
            f"  gear_checklist: array of strings (gear items to verify; when a selected place is relevant, include '— useful at Place Name' in the item)\n"
            f"  safety_advisory: string (plain-language safety/route advisory)\n"
            f"  confidence: 'high' or 'low'\n"
            f"  missing_info_flags: array of strings (any facts you needed but were missing)\n"
            f"{lang_instruction}"
            f"\nUse ONLY the facts above. Do not invent information."
        )
