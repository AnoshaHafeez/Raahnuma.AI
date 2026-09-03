from sqlalchemy import Boolean, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Product(Base):
    """A rentable or purchasable listing offered by a verified vendor."""

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendors.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    rent_price_per_day: Mapped[int] = mapped_column(Integer, nullable=False)
    buy_price: Mapped[int] = mapped_column(Integer, nullable=False)
    rating: Mapped[float | None] = mapped_column(nullable=True)
    image_url: Mapped[str] = mapped_column(String(1000), default="")
    use_tags: Mapped[list] = mapped_column(JSON, default=list)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    vendor = relationship("Vendor", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
