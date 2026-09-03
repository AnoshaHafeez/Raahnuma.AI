"""OSRM + Nominatim routing provider."""

from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.services.routing.base import RoutingProvider

logger = logging.getLogger(__name__)


class OSRMProvider(RoutingProvider):

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4), reraise=True)
    async def geocode(self, place_name: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{settings.nominatim_base_url}/search",
                params={"q": place_name, "format": "json", "limit": 1},
                headers={"User-Agent": settings.nominatim_user_agent},
            )
            resp.raise_for_status()
            results = resp.json()
            if not results:
                raise ValueError(f"Geocoding failed for: {place_name}")
            r = results[0]
            return {
                "lat": float(r["lat"]),
                "lon": float(r["lon"]),
                "display_name": r["display_name"],
            }

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4), reraise=True)
    async def get_route(
        self,
        start: tuple[float, float],
        end: tuple[float, float],
    ) -> dict[str, Any]:
        coords = f"{start[1]},{start[0]};{end[1]},{end[0]}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{settings.osrm_base_url}/route/v1/driving/{coords}",
                params={"overview": "false"},
            )
            resp.raise_for_status()
            data = resp.json()
            route = data["routes"][0]
            return {
                "distance_km": round(route["distance"] / 1000, 2),
                "duration_min": round(route["duration"] / 60, 1),
            }
