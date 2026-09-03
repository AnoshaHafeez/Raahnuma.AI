"""Open-Meteo weather provider with tenacity retry and Redis caching."""

from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.cache import cache_get, cache_set
from app.core.config import settings
from app.schemas.weather import DailyForecast, WeatherSnapshot
from app.services.weather.base import WeatherProvider

logger = logging.getLogger(__name__)

FORECAST_DAYS = 7


class OpenMeteoProvider(WeatherProvider):
    """Calls the free Open-Meteo API (no key required)."""

    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        reraise=True,
    )
    async def _fetch(self, lat: float, lon: float) -> dict:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                self.BASE_URL,
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": (
                        "temperature_2m,apparent_temperature,relative_humidity_2m,"
                        "precipitation,weather_code,wind_speed_10m"
                    ),
                    "hourly": "precipitation_probability,visibility",
                    "daily": (
                        "weather_code,temperature_2m_max,temperature_2m_min,"
                        "precipitation_probability_max"
                    ),
                    "forecast_days": FORECAST_DAYS,
                    "timezone": "auto",
                },
            )
            resp.raise_for_status()
            return resp.json()

    @staticmethod
    def _parse_daily(data: dict) -> list[DailyForecast]:
        """Zip Open-Meteo's parallel daily arrays into per-day objects.

        Open-Meteo returns each metric as its own array; a short or missing array
        simply yields fewer days rather than an error.
        """
        daily = data.get("daily") or {}
        dates = daily.get("time") or []
        highs = daily.get("temperature_2m_max") or []
        lows = daily.get("temperature_2m_min") or []
        codes = daily.get("weather_code") or []
        probs = daily.get("precipitation_probability_max") or []

        out: list[DailyForecast] = []
        for i, date in enumerate(dates):
            high = highs[i] if i < len(highs) else None
            low = lows[i] if i < len(lows) else None
            if high is None or low is None:
                continue
            out.append(
                DailyForecast(
                    date=str(date),
                    temp_max_c=high,
                    temp_min_c=low,
                    weather_code=codes[i] if i < len(codes) else 0,
                    precipitation_probability=probs[i] if i < len(probs) else None,
                )
            )
        return out

    @staticmethod
    def _first_hourly(data: dict, field: str) -> Any:
        """First available value of an hourly series, as a stand-in for 'now'."""
        series = (data.get("hourly") or {}).get(field) or []
        for value in series:
            if value is not None:
                return value
        return None

    async def get_forecast(self, lat: float, lon: float) -> WeatherSnapshot:
        # Round to 2 decimals for cache key reuse
        cache_key = f"weather:{round(lat, 2)}:{round(lon, 2)}"

        try:
            data = await self._fetch(lat, lon)
            current = data.get("current") or {}

            snapshot = WeatherSnapshot(
                temperature_c=current.get("temperature_2m", 0.0),
                wind_speed_kmh=current.get("wind_speed_10m", 0.0),
                precipitation_mm=current.get("precipitation", 0.0),
                weather_code=current.get("weather_code", 0),
                apparent_temperature_c=current.get("apparent_temperature"),
                relative_humidity=current.get("relative_humidity_2m"),
                precipitation_probability=self._first_hourly(
                    data, "precipitation_probability"
                ),
                visibility_m=self._first_hourly(data, "visibility"),
                elevation_m=data.get("elevation"),
                daily=self._parse_daily(data),
                stale=False,
                # Keep the hourly arrays out of `raw`: this snapshot is persisted on
                # every advisory row and cached, so it should stay small.
                raw={
                    key: value
                    for key, value in data.items()
                    if key not in ("hourly", "hourly_units")
                },
            )

            # Cache the fresh result
            await cache_set(
                cache_key,
                snapshot.model_dump(),
                ttl=settings.weather_cache_ttl_seconds,
            )
            return snapshot

        except Exception as exc:
            logger.warning("Open-Meteo fetch failed for (%s, %s): %s", lat, lon, exc)

            # Attempt to serve stale cache
            cached = await cache_get(cache_key)
            if cached is not None:
                logger.info("Serving stale cached weather for (%s, %s)", lat, lon)
                cached["stale"] = True
                return WeatherSnapshot(**cached)

            # Re-raise if nothing cached
            raise
