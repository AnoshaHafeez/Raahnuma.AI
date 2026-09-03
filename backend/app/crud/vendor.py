"""CRUD operations for Vendor entity."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.vendor import Vendor


async def get_vendors_by_destination(
    db: AsyncSession, destination_id: int
) -> list[Vendor]:
    result = await db.execute(
        select(Vendor)
        .where(Vendor.destination_id == destination_id, Vendor.is_active == True)
        .order_by(Vendor.name)
    )
    return list(result.scalars().all())


async def create_vendor(
    db: AsyncSession,
    destination_id: int,
    name: str,
    type: str,
    contact_phone: str = "",
    description: str = "",
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    last_verified_on=None,
    is_active: bool = True,
) -> Vendor:
    vendor = Vendor(
        destination_id=destination_id,
        name=name,
        type=type,
        contact_phone=contact_phone,
        description=description,
        latitude=latitude,
        longitude=longitude,
        last_verified_on=last_verified_on,
        is_active=is_active,
    )
    db.add(vendor)
    await db.flush()
    await db.refresh(vendor)
    return vendor
