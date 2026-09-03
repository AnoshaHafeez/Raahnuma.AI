from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Advisory(Base):
    __tablename__ = "advisories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), nullable=False, index=True)
    packing_list: Mapped[dict] = mapped_column(JSON, default=list)
    gear_checklist: Mapped[dict] = mapped_column(JSON, default=list)
    safety_advisory_text: Mapped[str] = mapped_column(Text, default="")
    safety_advisory_text_ur: Mapped[str] = mapped_column(Text, default="")
    confidence: Mapped[str] = mapped_column(String(10), default="low")
    source_weather_snapshot: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        comment="Exact weather data used to ground this advisory.",
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    trip = relationship("Trip", back_populates="advisories")
