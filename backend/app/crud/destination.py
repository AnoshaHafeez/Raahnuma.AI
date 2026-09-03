"""CRUD operations for Destination entity."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.destination import Destination


async def get_all_destinations(db: AsyncSession) -> list[Destination]:
    result = await db.execute(select(Destination).order_by(Destination.name))
    return list(result.scalars().all())


async def get_destination_by_id(db: AsyncSession, dest_id: int) -> Optional[Destination]:
    result = await db.execute(select(Destination).where(Destination.id == dest_id))
    return result.scalar_one_or_none()
