from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    destination_id: Mapped[int] = mapped_column(ForeignKey("destinations.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        comment="gear_rental or guide",
    )
    contact_phone: Mapped[str] = mapped_column(String(30), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_verified_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    destination = relationship("Destination", back_populates="vendors")
    products = relationship("Product", back_populates="vendor", cascade="all, delete-orphan")
