from datetime import date
from typing import Optional

from pydantic import BaseModel


class VendorCreate(BaseModel):
    destination_id: int
    name: str
    type: str  # "gear_rental" or "guide"
    contact_phone: str = ""
    description: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    last_verified_on: Optional[date] = None
    is_active: bool = True


class VendorOut(BaseModel):
    id: int
    destination_id: int
    name: str
    type: str
    contact_phone: str
    description: str
    latitude: Optional[float]
    longitude: Optional[float]
    last_verified_on: Optional[date]
    is_active: bool

    model_config = {"from_attributes": True}
