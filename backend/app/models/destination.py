from sqlalchemy import Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Destination(Base):
    __tablename__ = "destinations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    known_hazards: Mapped[str] = mapped_column(
        Text,
        default="",
        comment="Curated hazard info used as LLM grounding context.",
    )

    # Relationships
    trips = relationship("Trip", back_populates="destination")
    vendors = relationship("Vendor", back_populates="destination", cascade="all, delete-orphan")
    places = relationship("Place", back_populates="destination", cascade="all, delete-orphan")
    trail_reports = relationship("TrailReport", back_populates="destination", cascade="all, delete-orphan")
