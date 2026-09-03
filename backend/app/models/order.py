from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    trip_id: Mapped[int | None] = mapped_column(ForeignKey("trips.id"), nullable=True, index=True)
    recipient_name: Mapped[str] = mapped_column(String(160), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    delivery_address: Mapped[str] = mapped_column(Text, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(30), default="cod")
    status: Mapped[str] = mapped_column(String(30), default="placed")
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(160), nullable=False)
    mode: Mapped[str] = mapped_column(String(10), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    rental_days: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[int] = mapped_column(Integer, nullable=False)
    line_total: Mapped[int] = mapped_column(Integer, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
