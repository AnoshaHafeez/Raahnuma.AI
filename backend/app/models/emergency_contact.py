from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(30), nullable=False)

    # Relationships
    user = relationship("User", back_populates="emergency_contacts")
