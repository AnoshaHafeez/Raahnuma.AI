from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Profile fields consumed by the frontend user card / settings screen.
    full_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(8), default="en", nullable=False)
    experience_level: Mapped[str] = mapped_column(
        String(16), default="beginner", nullable=False
    )
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")
    emergency_contacts = relationship("EmergencyContact", back_populates="user", cascade="all, delete-orphan")
    sos_events = relationship("SOSEvent", back_populates="user", cascade="all, delete-orphan")
    trail_reports = relationship("TrailReport", back_populates="user", cascade="all, delete-orphan")
