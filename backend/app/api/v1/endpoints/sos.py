"""SOS and emergency contact endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.rate_limit import rate_limit
from app.crud.emergency_contact import (
    create_contact,
    delete_contact,
    get_contact_by_id,
    get_contacts_for_user,
)
from app.crud.sos_event import create_sos_event
from app.crud.trip import get_trip_by_id
from app.db.session import get_db
from app.models.user import User
from app.schemas.sos import (
    EmergencyContactCreate,
    EmergencyContactOut,
    SOSCreate,
    SOSResponse,
)

router = APIRouter()


@router.post("/sos", response_model=SOSResponse, dependencies=[Depends(rate_limit)])
async def trigger_sos(
    body: SOSCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Persist an SOS event and return a ready-to-send payload for the client."""
    # trip_id is optional, but when supplied it must refer to one of the
    # caller's trips.  Checking it here turns an otherwise opaque database
    # foreign-key failure into a useful API response and prevents linking an
    # SOS event to another user's itinerary.
    if body.trip_id is not None:
        trip = await get_trip_by_id(db, body.trip_id)
        if trip is None:
            raise HTTPException(status_code=404, detail="Trip not found.")
        if trip.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your trip.")

    sos_event = await create_sos_event(
        db,
        user_id=current_user.id,
        latitude=body.latitude,
        longitude=body.longitude,
        message=body.message or "EMERGENCY — I need help!",
        trip_id=body.trip_id,
    )

    contacts = await get_contacts_for_user(db, current_user.id)
    contact_outs = [EmergencyContactOut.model_validate(c) for c in contacts]

    prefilled = body.message or (
        f"EMERGENCY! I need help. My location: "
        f"https://www.openstreetmap.org/?mlat={body.latitude}&mlon={body.longitude}"
    )

    maps_link = (
        f"https://www.openstreetmap.org/?mlat={body.latitude}&mlon={body.longitude}"
    )

    return SOSResponse(
        sos_event_id=sos_event.id,
        contacts=contact_outs,
        prefilled_message=prefilled,
        maps_link=maps_link,
    )


@router.get("/emergency-contacts", response_model=list[EmergencyContactOut])
async def list_emergency_contacts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_contacts_for_user(db, current_user.id)


@router.post(
    "/emergency-contacts",
    response_model=EmergencyContactOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_emergency_contact(
    body: EmergencyContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_contact(db, current_user.id, body.name, body.phone_number)


@router.delete(
    "/emergency-contacts/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_emergency_contact(
    contact_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = await get_contact_by_id(db, contact_id)
    if contact is None:
        raise HTTPException(status_code=404, detail="Emergency contact not found.")
    # Return 404 rather than 403 for someone else's contact so the endpoint does
    # not confirm that a given contact id exists.
    if contact.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Emergency contact not found.")

    await delete_contact(db, contact)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
