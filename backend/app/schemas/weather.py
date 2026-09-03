from typing import Any, Optional

from pydantic import BaseModel


class DailyForecast(BaseModel):
    """One day of the outlook, used by the dashboard's 7-day strip."""

    date: str
    temp_max_c: float
    temp_min_c: float
    weather_code: int
    precipitation_probability: Optional[int] = None


class WeatherSnapshot(BaseModel):
    """Normalised weather data returned by any WeatherProvider."""

    temperature_c: float
    wind_speed_kmh: float
    precipitation_mm: float
    weather_code: int

    # Optional enrichments — absent when the upstream response omits them or when
    # an older cached snapshot is replayed.
    apparent_temperature_c: Optional[float] = None
    relative_humidity: Optional[int] = None
    precipitation_probability: Optional[int] = None
    visibility_m: Optional[float] = None
    elevation_m: Optional[float] = None
    daily: list[DailyForecast] = []

    stale: bool = False
    raw: dict[str, Any] = {}


class WeatherResponse(BaseModel):
    destination_id: int
    destination_name: str
    weather: WeatherSnapshot
