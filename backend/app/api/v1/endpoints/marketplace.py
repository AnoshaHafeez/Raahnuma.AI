"""Catalogue, trip-specific gear recommendations, and COD order checkout."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.order import Order, OrderItem
from app.models.place import Place
from app.models.product import Product
from app.models.trip import Trip
from app.models.user import User
from app.models.vendor import Vendor
from app.schemas.marketplace import GearRecommendationOut, OrderCreate, OrderOut, ProductOut

router = APIRouter()


def product_out(product: Product) -> ProductOut:
    vendor = product.vendor
    return ProductOut(
        id=product.id, name=product.name, category=product.category,
        rent_price_per_day=product.rent_price_per_day, buy_price=product.buy_price,
        rating=product.rating, image_url=product.image_url, use_tags=product.use_tags or [],
        stock_quantity=product.stock_quantity, vendor_id=vendor.id, vendor_name=vendor.name,
        vendor_location=vendor.destination.name, destination_id=vendor.destination_id,
        destination_name=vendor.destination.name,
    )


@router.get("/marketplace/products", response_model=list[ProductOut])
async def list_products(destination_id: int | None = None, db: AsyncSession = Depends(get_db)):
    statement = select(Product).options(selectinload(Product.vendor).selectinload(Vendor.destination)).where(Product.is_active.is_(True))
    if destination_id is not None:
        statement = statement.join(Product.vendor).where(Vendor.destination_id == destination_id)
    result = await db.execute(statement.order_by(Product.name))
    return [product_out(product) for product in result.scalars().unique()]


@router.get("/trips/{trip_id}/gear-recommendations", response_model=list[GearRecommendationOut])
async def gear_recommendations(trip_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = await db.scalar(select(Trip).where(Trip.id == trip_id))
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your trip.")
    profile = trip.traveler_profile or {}
    selected_ids = {int(value) for value in profile.get("selected_place_ids", []) if str(value).isdigit()}
    places_result = await db.execute(select(Place).where(Place.destination_id == trip.destination_id))
    places = list(places_result.scalars())
    selected_places = [place for place in places if not selected_ids or place.id in selected_ids]
    tags = {tag.lower() for place in selected_places for tag in (place.activity_tags or [])}
    products = await db.execute(
        select(Product).join(Product.vendor).options(selectinload(Product.vendor).selectinload(Vendor.destination))
        .where(Product.is_active.is_(True), Vendor.destination_id == trip.destination_id)
    )
    output: list[GearRecommendationOut] = []
    place_names = [place.name for place in selected_places]
    for product in products.scalars().unique():
        matched = sorted(tags.intersection({tag.lower() for tag in (product.use_tags or [])}))
        if not matched and product.category not in {"Kit", "Power"}:
            continue
        base = product_out(product).model_dump()
        use_at = place_names[:3] or [product.vendor.destination.name]
        reason = f"Useful for {', '.join(use_at)}" + (f" because of {', '.join(matched)} activities." if matched else ".")
        output.append(GearRecommendationOut(**base, recommended_for=use_at, reason=reason))
    return output


@router.post("/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(body: OrderCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if body.trip_id is not None:
        trip = await db.scalar(select(Trip).where(Trip.id == body.trip_id))
        if not trip or trip.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="The selected trip is not available to this account.")
    # The UI coalesces cart lines, but validate the public API too: a caller
    # must not be able to submit duplicate lines to bypass stock checks.
    requested_quantities: dict[int, int] = {}
    for item in body.items:
        requested_quantities[item.product_id] = requested_quantities.get(item.product_id, 0) + item.quantity

    ids = set(requested_quantities)
    result = await db.execute(
        select(Product)
        .where(Product.id.in_(ids), Product.is_active.is_(True))
        .with_for_update()
    )
    products = {product.id: product for product in result.scalars()}
    if len(products) != len(ids):
        raise HTTPException(status_code=400, detail="One or more products are unavailable.")
    order = Order(user_id=current_user.id, trip_id=body.trip_id, recipient_name=body.recipient_name.strip(), phone=body.phone.strip(), delivery_address=body.delivery_address.strip(), payment_method="cod", status="placed", total_amount=0)
    db.add(order)
    total = 0
    for item in body.items:
        product = products[item.product_id]
        if product.stock_quantity < requested_quantities[product.id]:
            raise HTTPException(status_code=400, detail=f"Only {product.stock_quantity} unit(s) of {product.name} are available.")
        unit_price = product.rent_price_per_day if item.mode == "rent" else product.buy_price
        days = item.rental_days if item.mode == "rent" else 1
        line_total = unit_price * item.quantity * days
        total += line_total
        order.items.append(OrderItem(product_id=product.id, product_name=product.name, mode=item.mode, quantity=item.quantity, rental_days=days, unit_price=unit_price, line_total=line_total))
    for product_id, quantity in requested_quantities.items():
        products[product_id].stock_quantity -= quantity
    order.total_amount = total
    await db.flush()
    await db.refresh(order, attribute_names=["items"])
    return order
