"""Mapped model registry.

Importing any model pulls in every model, so SQLAlchemy can always resolve the
string-based `relationship()` targets (`"TripPlace"`, `"Advisory"`, ...) and
`Base.metadata` is always complete for `create_all` / Alembic autogenerate.
"""

from app.models.advisory import Advisory
from app.models.destination import Destination
from app.models.emergency_contact import EmergencyContact
from app.models.order import Order, OrderItem
from app.models.place import Place
from app.models.product import Product
from app.models.sos_event import SOSEvent
from app.models.trail_report import TrailReport
from app.models.trip import Trip
from app.models.trip_place import TripPlace
from app.models.user import User
from app.models.vendor import Vendor

__all__ = [
    "Advisory",
    "Destination",
    "EmergencyContact",
    "Order",
    "OrderItem",
    "Place",
    "Product",
    "SOSEvent",
    "TrailReport",
    "Trip",
    "TripPlace",
    "User",
    "Vendor",
]
