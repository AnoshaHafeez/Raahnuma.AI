"""Abstract base class for routing/geocoding providers."""

from abc import ABC, abstractmethod
from typing import Any


class RoutingProvider(ABC):
    @abstractmethod
    async def geocode(self, place_name: str) -> dict[str, Any]:
        """Return {'lat': float, 'lon': float, 'display_name': str}."""
        ...

    @abstractmethod
    async def get_route(
        self,
        start: tuple[float, float],
        end: tuple[float, float],
    ) -> dict[str, Any]:
        """Return route info including distance_km and duration_min."""
        ...
