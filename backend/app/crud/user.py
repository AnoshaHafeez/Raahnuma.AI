"""CRUD operations for User entity."""

from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User


async def create_user(
    db: AsyncSession,
    email: str,
    password: str,
    full_name: Optional[str] = None,
    phone: Optional[str] = None,
    preferred_language: str = "en",
    experience_level: str = "beginner",
) -> User:
    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
        phone=phone,
        preferred_language=preferred_language,
        experience_level=experience_level,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def update_user(db: AsyncSession, user: User, changes: dict[str, Any]) -> User:
    """Apply a partial profile update. Only known, non-None fields are written."""
    allowed = {"full_name", "phone", "preferred_language", "experience_level"}
    for field, value in changes.items():
        if field in allowed and value is not None:
            setattr(user, field, value)
    await db.flush()
    await db.refresh(user)
    return user


async def update_user_password(db: AsyncSession, user: User, new_password: str) -> User:
    user.hashed_password = hash_password(new_password)
    await db.flush()
    await db.refresh(user)
    return user
