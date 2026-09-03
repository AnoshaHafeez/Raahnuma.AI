"""Weather endpoint — fetches live weather for a destination."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.destination import get_destination_by_id
from app.db.session import get_db
from app.schemas.weather import WeatherResponse
from app.services.weather.base import WeatherProvider
from app.services.weather.open_meteo import OpenMeteoProvider

router = APIRouter()


def get_weather_provider() -> WeatherProvider:
    """FastAPI dependency — returns the configured weather provider."""
    return OpenMeteoProvider()


@router.get("/{destination_id}", response_model=WeatherResponse)
async def get_weather(
    destination_id: int,
    db: AsyncSession = Depends(get_db),
    weather_provider: WeatherProvider = Depends(get_weather_provider),
):
    dest = await get_destination_by_id(db, destination_id)
    if not dest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Destination not found.")

    snapshot = await weather_provider.get_forecast(dest.latitude, dest.longitude)
    return WeatherResponse(
        destination_id=dest.id,
        destination_name=dest.name,
        weather=snapshot,
    )
