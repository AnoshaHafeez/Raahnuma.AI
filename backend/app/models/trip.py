from datetime import date, datetime, timezone

from sqlalchemy import JSON, Date, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    destination_id: Mapped[int] = mapped_column(ForeignKey("destinations.id"), nullable=False, index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    traveler_profile: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        comment="Group size, experience level, camping vs day-trip, etc.",
    )
    language: Mapped[str] = mapped_column(String(5), default="en")
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="trips")
    destination = relationship("Destination", back_populates="trips")
    advisories = relationship("Advisory", back_populates="trip", cascade="all, delete-orphan")
    sos_events = relationship("SOSEvent", back_populates="trip")
    trip_places = relationship(
        "TripPlace",
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="TripPlace.sort_order",
    )
