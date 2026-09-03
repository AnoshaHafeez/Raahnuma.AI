"""CRUD operations for SOSEvent entity."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sos_event import SOSEvent


async def create_sos_event(
    db: AsyncSession,
    user_id: int,
    latitude: float,
    longitude: float,
    message: str = "",
    trip_id: int | None = None,
) -> SOSEvent:
    event = SOSEvent(
        user_id=user_id,
        trip_id=trip_id,
        latitude=latitude,
        longitude=longitude,
        message=message,
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return event
