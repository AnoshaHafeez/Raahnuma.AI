"""Tests for weather service adapter using mocked HTTP."""

import pytest
import respx
from httpx import Response

from app.services.weather.open_meteo import OpenMeteoProvider


@pytest.mark.asyncio
@respx.mock
async def test_open_meteo_provider_success():
    """Verify OpenMeteoProvider parses a valid response."""
    respx.get("https://api.open-meteo.com/v1/forecast").mock(
        return_value=Response(
            200,
            json={
                "current": {
                    "temperature_2m": 15.3,
                    "wind_speed_10m": 22.1,
                    "precipitation": 0.0,
                    "weather_code": 1,
                },
                "hourly": {"temperature_2m": [14, 15, 16], "precipitation_probability": [0, 0, 5]},
            },
        )
    )

    provider = OpenMeteoProvider()
    snapshot = await provider.get_forecast(36.32, 74.88)

    assert snapshot.temperature_c == 15.3
    assert snapshot.wind_speed_kmh == 22.1
    assert snapshot.precipitation_mm == 0.0
    assert snapshot.weather_code == 1
    assert snapshot.stale is False


@pytest.mark.asyncio
@respx.mock
async def test_open_meteo_provider_failure_no_cache():
    """When the API fails and there is no cache, the provider should raise."""
    respx.get("https://api.open-meteo.com/v1/forecast").mock(
        side_effect=Exception("network error")
    )

    provider = OpenMeteoProvider()
    with pytest.raises(Exception):
        await provider.get_forecast(0.0, 0.0)
