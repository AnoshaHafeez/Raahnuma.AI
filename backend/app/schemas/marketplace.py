from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PlaceOut(BaseModel):
    id: int
    destination_id: int
    name: str
    description: str
    activity_tags: list[str]
    latitude: float | None
    longitude: float | None
    community_rating: float | None
    review_count: int
    community_review: str
    image_url: str
    popularity_rank: int | None = None

    model_config = {"from_attributes": True}


class ProductOut(BaseModel):
    id: int
    name: str
    category: str
    rent_price_per_day: int
    buy_price: int
    rating: float | None
    image_url: str
    use_tags: list[str]
    stock_quantity: int
    vendor_id: int
    vendor_name: str
    vendor_location: str
    destination_id: int
    destination_name: str


class GearRecommendationOut(ProductOut):
    recommended_for: list[str]
    reason: str


class OrderItemCreate(BaseModel):
    product_id: int
    mode: Literal["rent", "buy"]
    quantity: int = Field(ge=1, le=20)
    rental_days: int = Field(default=1, ge=1, le=60)


class OrderCreate(BaseModel):
    recipient_name: str = Field(min_length=2, max_length=160)
    phone: str = Field(min_length=7, max_length=40)
    delivery_address: str = Field(min_length=10, max_length=1000)
    payment_method: Literal["cod"] = "cod"
    trip_id: int | None = None
    items: list[OrderItemCreate] = Field(min_length=1, max_length=30)


class OrderItemOut(BaseModel):
    product_id: int
    product_name: str
    mode: str
    quantity: int
    rental_days: int
    unit_price: int
    line_total: int

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    trip_id: int | None
    recipient_name: str
    phone: str
    delivery_address: str
    payment_method: str
    status: str
    total_amount: int
    created_at: datetime
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}
