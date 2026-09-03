"""CRUD operations for EmergencyContact entity."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.emergency_contact import EmergencyContact


async def get_contacts_for_user(
    db: AsyncSession, user_id: int
) -> list[EmergencyContact]:
    result = await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.user_id == user_id)
        .order_by(EmergencyContact.id)
    )
    return list(result.scalars().all())


async def get_contact_by_id(
    db: AsyncSession, contact_id: int
) -> Optional[EmergencyContact]:
    result = await db.execute(
        select(EmergencyContact).where(EmergencyContact.id == contact_id)
    )
    return result.scalar_one_or_none()


async def create_contact(
    db: AsyncSession, user_id: int, name: str, phone_number: str
) -> EmergencyContact:
    contact = EmergencyContact(
        user_id=user_id, name=name, phone_number=phone_number
    )
    db.add(contact)
    await db.flush()
    await db.refresh(contact)
    return contact


async def delete_contact(db: AsyncSession, contact: EmergencyContact) -> None:
    await db.delete(contact)
    await db.flush()
