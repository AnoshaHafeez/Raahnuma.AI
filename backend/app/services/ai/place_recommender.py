"""Ranks the attractions of a destination and picks the ones worth suggesting.

Two layers, always in this order:

1. A deterministic heuristic score built from the curated popularity rank, the
   community rating/review volume, and how often the place shows up in recent
   trail reports. This is the grounding.
2. An LLM pass that re-orders the shortlist and writes the one-line "why go"
   copy, using only the facts from layer 1.

Layer 2 is best-effort. Both AI providers can be down (or a key can be
invalid) and the endpoint must still return a usable ranking, so a failure
falls through to the heuristic order with generated reasons.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.destination import Destination
from app.models.place import Place
from app.models.trail_report import TrailReport
from app.services.ai.base import AIProvider

logger = logging.getLogger(__name__)

# How far back a trail report still counts as "recent" interest.
RECENT_WINDOW_DAYS = 120

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "picks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "place_id": {"type": "integer"},
                    "reason": {"type": "string"},
                },
                "required": ["place_id", "reason"],
            },
        },
    },
    "required": ["summary", "picks"],
}


class RankedPlace:
    """A place plus the signals that earned it its position."""

    def __init__(self, place: Place, recent_mentions: int) -> None:
        self.place = place
        self.recent_mentions = recent_mentions
        self.reason = ""

    @property
    def score(self) -> float:
        place = self.place
        # Curated rank dominates: rank 1 is the flagship attraction travellers
        # ask for by name. Unranked places sit below every ranked one.
        rank = place.popularity_rank or 99
        score = max(0.0, 100.0 - (rank - 1) * 6.0)
        if place.community_rating:
            score += place.community_rating * 4.0
        # Review volume matters but must not let one busy place bury the
        # flagship attractions, so it is capped.
        score += min(place.review_count or 0, 25) * 0.4
        score += min(self.recent_mentions, 10) * 2.5
        return score

    def as_dict(self) -> dict[str, Any]:
        return {
            "place_id": self.place.id,
            "name": self.place.name,
            "description": self.place.description or "",
            "activity_tags": list(self.place.activity_tags or []),
            "popularity_rank": self.place.popularity_rank,
            "community_rating": self.place.community_rating,
            "review_count": self.place.review_count or 0,
            "recent_mentions": self.recent_mentions,
            "reason": self.reason,
        }


class PlaceRecommender:
    """Produces the "top picks" shortlist shown in the trip planner."""

    def __init__(
        self,
        db: AsyncSession,
        primary_ai: AIProvider | None = None,
        fallback_ai: AIProvider | None = None,
    ) -> None:
        self.db = db
        self.primary_ai = primary_ai
        self.fallback_ai = fallback_ai

    async def recommend(self, destination_id: int, limit: int = 5) -> dict[str, Any]:
        destination = await self.db.scalar(
            select(Destination).where(Destination.id == destination_id)
        )
        if destination is None:
            raise ValueError(f"Destination {destination_id} not found")

        places = list(
            (
                await self.db.execute(
                    select(Place).where(Place.destination_id == destination_id)
                )
            ).scalars()
        )
        if not places:
            return {
                "destination_id": destination_id,
                "destination_name": destination.name,
                "source": "heuristic",
                "summary": "No attractions have been catalogued for this destination yet.",
                "picks": [],
                "generated_at": datetime.now(timezone.utc),
            }

        mentions = await self._recent_mentions(destination_id, places)
        ranked = sorted(
            (RankedPlace(place, mentions.get(place.id, 0)) for place in places),
            key=lambda item: (-item.score, item.place.name),
        )
        shortlist = ranked[: max(limit * 2, limit)]

        ai_result = await self._ask_ai(destination, shortlist, limit)
        if ai_result is not None:
            picks = self._apply_ai_order(shortlist, ai_result, limit)
            if picks:
                return {
                    "destination_id": destination_id,
                    "destination_name": destination.name,
                    "source": "ai",
                    "summary": ai_result.get("summary", "").strip()
                    or self._heuristic_summary(destination, picks),
                    "picks": [item.as_dict() for item in picks],
                    "generated_at": datetime.now(timezone.utc),
                }

        picks = shortlist[:limit]
        for item in picks:
            item.reason = self._heuristic_reason(item)
        return {
            "destination_id": destination_id,
            "destination_name": destination.name,
            "source": "heuristic",
            "summary": self._heuristic_summary(destination, picks),
            "picks": [item.as_dict() for item in picks],
            "generated_at": datetime.now(timezone.utc),
        }

    async def _recent_mentions(
        self, destination_id: int, places: list[Place]
    ) -> dict[int, int]:
        """Count recent trail reports attached to — or naming — each place.

        Reports written before `place_id` existed only name the place in their
        text, so both signals are counted to keep older community data useful.
        """
        since = datetime.now(timezone.utc) - timedelta(days=RECENT_WINDOW_DAYS)
        rows = (
            await self.db.execute(
                select(TrailReport.place_id, TrailReport.report_text).where(
                    TrailReport.destination_id == destination_id,
                    TrailReport.created_at >= since,
                )
            )
        ).all()

        counts: dict[int, int] = {}
        lowered = [(place.id, place.name.lower()) for place in places]
        for place_id, report_text in rows:
            if place_id is not None:
                counts[place_id] = counts.get(place_id, 0) + 1
                continue
            haystack = (report_text or "").lower()
            for candidate_id, name in lowered:
                if name and name in haystack:
                    counts[candidate_id] = counts.get(candidate_id, 0) + 1
        return counts

    async def _ask_ai(
        self, destination: Destination, shortlist: list[RankedPlace], limit: int
    ) -> dict[str, Any] | None:
        providers = [
            ("groq", self.primary_ai),
            ("gemini", self.fallback_ai),
        ]
        prompt = self._build_prompt(destination, shortlist, limit)
        for name, provider in providers:
            if provider is None:
                continue
            try:
                result = await provider.generate(prompt, RESPONSE_SCHEMA)
                logger.info(
                    "Place recommendations for %s served by %s", destination.name, name
                )
                return result
            except Exception as exc:
                logger.warning("Place recommender via %s failed: %s", name, exc)
        logger.info(
            "Falling back to heuristic place ranking for %s", destination.name
        )
        return None

    @staticmethod
    def _build_prompt(
        destination: Destination, shortlist: list[RankedPlace], limit: int
    ) -> str:
        lines = []
        for item in shortlist:
            place = item.place
            lines.append(
                f"- place_id={place.id} | {place.name} | "
                f"curated_popularity_rank={place.popularity_rank or 'unranked'} | "
                f"community_rating={place.community_rating or 'none'} | "
                f"reviews={place.review_count or 0} | "
                f"recent_trail_reports={item.recent_mentions} | "
                f"activities={', '.join(place.activity_tags or []) or 'none'} | "
                f"description={place.description or 'none'}"
            )
        return (
            f"You are helping a traveller plan a trip to {destination.name}, Pakistan.\n"
            f"Known hazards for the destination: {destination.known_hazards}\n\n"
            f"Candidate attractions (curated_popularity_rank 1 = most visited):\n"
            + "\n".join(lines)
            + "\n\n"
            f"Pick the {limit} attractions most travellers should not miss. Weigh the "
            f"curated popularity rank first, then community rating, review volume and "
            f"the number of recent trail reports.\n\n"
            f"Return a JSON object:\n"
            f"  summary: string — one or two sentences on what these picks give the trip\n"
            f"  picks: array of exactly {limit} objects, most recommended first, each with\n"
            f"    place_id: integer — must be one of the place_id values above\n"
            f"    reason: string — max 18 words on why it is worth visiting\n\n"
            f"Use ONLY the facts above. Do not invent attractions, place_ids or figures."
        )

    @staticmethod
    def _apply_ai_order(
        shortlist: list[RankedPlace], ai_result: dict[str, Any], limit: int
    ) -> list[RankedPlace]:
        """Map the model's picks back onto real rows, dropping anything invented."""
        by_id = {item.place.id: item for item in shortlist}
        picks: list[RankedPlace] = []
        seen: set[int] = set()
        for raw in ai_result.get("picks") or []:
            if not isinstance(raw, dict):
                continue
            try:
                place_id = int(raw.get("place_id"))
            except (TypeError, ValueError):
                continue
            item = by_id.get(place_id)
            if item is None or place_id in seen:
                continue
            seen.add(place_id)
            reason = str(raw.get("reason") or "").strip()
            item.reason = reason or PlaceRecommender._heuristic_reason(item)
            picks.append(item)
            if len(picks) == limit:
                break
        # Top up from the heuristic order if the model returned too few.
        for item in shortlist:
            if len(picks) >= limit:
                break
            if item.place.id in seen:
                continue
            item.reason = PlaceRecommender._heuristic_reason(item)
            picks.append(item)
            seen.add(item.place.id)
        return picks

    @staticmethod
    def _heuristic_reason(item: RankedPlace) -> str:
        place = item.place
        bits: list[str] = []
        if place.popularity_rank == 1:
            bits.append("the destination's most visited attraction")
        elif place.popularity_rank and place.popularity_rank <= 5:
            bits.append(f"a top-{place.popularity_rank} draw here")
        if place.activity_tags:
            bits.append(f"good for {', '.join(list(place.activity_tags)[:2])}")
        if item.recent_mentions:
            plural = "s" if item.recent_mentions != 1 else ""
            bits.append(f"{item.recent_mentions} recent trail report{plural}")
        if place.community_rating:
            bits.append(f"rated {place.community_rating:g} by the community")
        if not bits:
            return "A popular stop for visitors to this area."
        return (bits[0][0].upper() + bits[0][1:]) + (
            f" — {', '.join(bits[1:])}." if len(bits) > 1 else "."
        )

    @staticmethod
    def _heuristic_summary(destination: Destination, picks: list[RankedPlace]) -> str:
        if not picks:
            return f"No attractions have been catalogued for {destination.name} yet."
        names = ", ".join(item.place.name for item in picks)
        return (
            f"Most travellers to {destination.name} build their itinerary around "
            f"{names}. Ranked from curated visitor popularity and recent community reports."
        )
