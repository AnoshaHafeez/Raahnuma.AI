"""Abstract base class for weather providers."""

from abc import ABC, abstractmethod

from app.schemas.weather import WeatherSnapshot


class WeatherProvider(ABC):
    @abstractmethod
    async def get_forecast(self, lat: float, lon: float) -> WeatherSnapshot:
        """Fetch current weather conditions for the given coordinates."""
        ...
