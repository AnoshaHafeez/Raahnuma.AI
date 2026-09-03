from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TripPlace(Base):
    """A place a traveller picked for a trip, plus whether they have been there.

    This is the durable backing store for the trip itinerary checklist, so tick
    marks survive a logout instead of living only in the client store.
    """

    __tablename__ = "trip_places"
    __table_args__ = (UniqueConstraint("trip_id", "place_id", name="uq_trip_places_trip_place"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), nullable=False, index=True)
    place_id: Mapped[int] = mapped_column(ForeignKey("places.id"), nullable=False, index=True)
    visited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    visited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Preserves the order the traveller selected the places in.",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    trip = relationship("Trip", back_populates="trip_places")
    place = relationship("Place", back_populates="trip_places")
