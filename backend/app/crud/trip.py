"""CRUD operations for Trip entity."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.trip import Trip


async def create_trip(
    db: AsyncSession,
    user_id: int,
    destination_id: int,
    start_date,
    end_date,
    traveler_profile: dict,
    language: str,
) -> Trip:
    trip = Trip(
        user_id=user_id,
        destination_id=destination_id,
        start_date=start_date,
        end_date=end_date,
        traveler_profile=traveler_profile,
        language=language,
    )
    db.add(trip)
    await db.flush()
    await db.refresh(trip)
    return trip


async def get_trip_by_id(db: AsyncSession, trip_id: int) -> Optional[Trip]:
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.destination), selectinload(Trip.advisories))
        .where(Trip.id == trip_id)
    )
    return result.scalar_one_or_none()


async def get_user_trips(db: AsyncSession, user_id: int) -> list[Trip]:
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.advisories))
        .where(Trip.user_id == user_id)
        .order_by(Trip.created_at.desc())
    )
    return list(result.scalars().all())
