from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SOSEvent(Base):
    __tablename__ = "sos_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    trip_id: Mapped[int | None] = mapped_column(ForeignKey("trips.id"), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    message: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="sos_events")
    trip = relationship("Trip", back_populates="sos_events")
