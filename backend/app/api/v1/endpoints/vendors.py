"""Vendor endpoints — list by destination and admin create."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.crud.vendor import create_vendor, get_vendors_by_destination
from app.db.session import get_db
from app.models.user import User
from app.schemas.vendor import VendorCreate, VendorOut

router = APIRouter()


@router.get("/destinations/{destination_id}/vendors", response_model=list[VendorOut])
async def list_vendors(
    destination_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await get_vendors_by_destination(db, destination_id)


@router.post("/vendors", response_model=VendorOut, status_code=status.HTTP_201_CREATED)
async def create_vendor_endpoint(
    body: VendorCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Create a vendor. Restricted to admins since the vendor list is shared catalogue data."""
    vendor = await create_vendor(
        db,
        destination_id=body.destination_id,
        name=body.name,
        type=body.type,
        contact_phone=body.contact_phone,
        description=body.description,
        latitude=body.latitude,
        longitude=body.longitude,
        last_verified_on=body.last_verified_on,
        is_active=body.is_active,
    )
    return vendor
