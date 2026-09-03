"""Test that advisory generation returns a clear error when both AI providers fail."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.ai.advisory_service import AdvisoryService
from app.services.ai.base import AIProvider
from app.services.weather.base import WeatherProvider
from app.schemas.weather import WeatherSnapshot


class FailingAIProvider(AIProvider):
    async def generate(self, prompt, response_schema):
        raise RuntimeError("AI provider is down")


class MockWeatherProvider(WeatherProvider):
    async def get_forecast(self, lat, lon):
        return WeatherSnapshot(
            temperature_c=10.0,
            wind_speed_kmh=5.0,
            precipitation_mm=0.0,
            weather_code=0,
        )


@pytest.mark.asyncio
async def test_both_ai_providers_fail():
    """When both Groq and Gemini fail, AdvisoryService should raise RuntimeError,
    not return a fabricated advisory."""
    mock_db = AsyncMock()
    mock_db.execute = AsyncMock()

    # Mock the trip lookup
    mock_trip = MagicMock()
    mock_trip.id = 1
    mock_trip.start_date = "2026-06-01"
    mock_trip.end_date = "2026-06-07"
    mock_trip.traveler_profile = {"group_size": 2, "experience": "beginner"}
    mock_trip.language = "en"
    mock_trip.destination = MagicMock()
    mock_trip.destination.name = "Hunza"
    mock_trip.destination.known_hazards = "Landslides"
    mock_trip.destination.latitude = 36.32
    mock_trip.destination.longitude = 74.88

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_trip
    mock_db.execute.return_value = mock_result

    svc = AdvisoryService(
        weather_provider=MockWeatherProvider(),
        primary_ai=FailingAIProvider(),
        fallback_ai=FailingAIProvider(),
        db=mock_db,
    )

    with pytest.raises(RuntimeError, match="Both AI providers are unavailable"):
        await svc.generate_advisory(trip_id=1, bypass_cache=True)
