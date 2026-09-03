from typing import Any, Optional

from pydantic import BaseModel


class SOSCreate(BaseModel):
    latitude: float
    longitude: float
    trip_id: Optional[int] = None
    message: Optional[str] = None


class EmergencyContactCreate(BaseModel):
    name: str
    phone_number: str


class EmergencyContactOut(BaseModel):
    id: int
    user_id: int
    name: str
    phone_number: str

    model_config = {"from_attributes": True}


class SOSResponse(BaseModel):
    sos_event_id: int
    contacts: list[EmergencyContactOut]
    prefilled_message: str
    maps_link: str
