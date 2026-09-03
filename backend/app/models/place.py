from sqlalchemy import Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Place(Base):
    """A curated attraction a traveller can include in a destination trip."""

    __tablename__ = "places"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    destination_id: Mapped[int] = mapped_column(ForeignKey("destinations.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    activity_tags: Mapped[list] = mapped_column(JSON, default=list)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    community_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    community_review: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str] = mapped_column(String(1000), default="")
    popularity_rank: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="1 = most visited attraction of the destination. Grounds the AI top-picks ranking.",
    )

    destination = relationship("Destination", back_populates="places")
    trip_places = relationship("TripPlace", back_populates="place", cascade="all, delete-orphan")
