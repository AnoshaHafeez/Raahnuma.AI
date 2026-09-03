"""Catalogue, itinerary matching, and server-priced COD checkout tests."""

from datetime import date

import pytest
from sqlalchemy import select

from app.models.destination import Destination
from app.models.place import Place
from app.models.product import Product
from app.models.trip import Trip
from app.models.user import User
from app.models.vendor import Vendor
from app.tests.conftest import test_session_factory as session_factory


async def _seed_catalogue_for_user() -> tuple[int, int, int]:
    async with session_factory() as db:
        user = await db.scalar(select(User).where(User.email == "test@example.com"))
        destination = Destination(name="Naran", latitude=34.8983, longitude=73.6511)
        db.add(destination)
        await db.flush()
        place = Place(
            destination_id=destination.id,
            name="Lake Saif-ul-Malook",
            description="Lake excursion",
            activity_tags=["jeep", "lake", "walking"],
        )
        vendor = Vendor(destination_id=destination.id, name="Naran Gear", type="gear_rental")
        db.add_all([place, vendor])
        await db.flush()
        product = Product(
            vendor_id=vendor.id,
            name="Trekking Jacket",
            category="Jacket",
            rent_price_per_day=900,
            buy_price=11500,
            use_tags=["walking", "jeep"],
            stock_quantity=4,
        )
        db.add(product)
        await db.flush()
        trip = Trip(
            user_id=user.id,
            destination_id=destination.id,
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 3),
            traveler_profile={"selected_place_ids": [place.id]},
        )
        db.add(trip)
        await db.commit()
        return trip.id, destination.id, product.id


@pytest.mark.asyncio
async def test_trip_recommendations_and_cod_total(auth_client):
    trip_id, destination_id, product_id = await _seed_catalogue_for_user()

    places = await auth_client.get(f"/api/v1/destinations/{destination_id}/places")
    assert places.status_code == 200
    assert places.json()[0]["name"] == "Lake Saif-ul-Malook"

    recommendations = await auth_client.get(f"/api/v1/trips/{trip_id}/gear-recommendations")
    assert recommendations.status_code == 200
    assert recommendations.json()[0]["recommended_for"] == ["Lake Saif-ul-Malook"]

    order = await auth_client.post(
        "/api/v1/orders",
        json={
            "recipient_name": "Test Traveler",
            "phone": "+923001234567",
            "delivery_address": "Hotel Naran, Main Bazaar, Naran",
            "payment_method": "cod",
            "trip_id": trip_id,
            "items": [{"product_id": product_id, "mode": "rent", "quantity": 2, "rental_days": 3}],
        },
    )
    assert order.status_code == 201
    assert order.json()["total_amount"] == 5400
    assert order.json()["items"][0]["line_total"] == 5400

    async with session_factory() as db:
        product = await db.get(Product, product_id)
        assert product.stock_quantity == 2


@pytest.mark.asyncio
async def test_order_rejects_combined_quantity_over_stock(auth_client):
    _trip_id, _destination_id, product_id = await _seed_catalogue_for_user()
    response = await auth_client.post(
        "/api/v1/orders",
        json={
            "recipient_name": "Test Traveler",
            "phone": "+923001234567",
            "delivery_address": "Hotel Naran, Main Bazaar, Naran",
            "items": [
                {"product_id": product_id, "mode": "rent", "quantity": 3, "rental_days": 1},
                {"product_id": product_id, "mode": "buy", "quantity": 2, "rental_days": 1},
            ],
        },
    )
    assert response.status_code == 400
    assert "Only 4 unit(s)" in response.json()["detail"]
