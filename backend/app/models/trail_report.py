from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TrailReport(Base):
    __tablename__ = "trail_reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    destination_id: Mapped[int] = mapped_column(ForeignKey("destinations.id"), nullable=False, index=True)
    place_id: Mapped[int | None] = mapped_column(
        ForeignKey("places.id"),
        nullable=True,
        index=True,
        comment="Set when the report is about one specific attraction rather than the whole destination.",
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    report_text: Mapped[str] = mapped_column(Text, nullable=False)
    condition: Mapped[str] = mapped_column(
        String(20),
        default="clear",
        comment="clear / caution / closed",
    )
    upvote_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    destination = relationship("Destination", back_populates="trail_reports")
    place = relationship("Place")
    user = relationship("User", back_populates="trail_reports")
