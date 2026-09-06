"""Trip CRUD endpoints + offline trip pack."""

from __future__ import annotations

import io
import logging
import textwrap
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from sqlalchemy import inspect as sa_inspect, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.rate_limit import rate_limit
from app.crud.destination import get_destination_by_id
from app.crud.trip import create_trip, get_trip_by_id, get_user_trips
from app.crud.vendor import get_vendors_by_destination
from app.db.session import get_db
from app.models.place import Place
from app.models.trip_place import TripPlace
from app.models.user import User
from app.schemas.trip import AdvisoryOut, OfflinePack, TripCreate, TripOut
from app.schemas.vendor import VendorOut
from app.services.ai.advisory_service import AdvisoryService, DISCLAIMER
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.groq_provider import GroqProvider
from app.services.weather.open_meteo import OpenMeteoProvider

logger = logging.getLogger(__name__)

router = APIRouter()


def _advisory_to_out(advisory) -> AdvisoryOut:
    return AdvisoryOut(
        id=advisory.id,
        packing_list=advisory.packing_list,
        gear_checklist=advisory.gear_checklist,
        safety_advisory_text=advisory.safety_advisory_text,
        safety_advisory_text_ur=advisory.safety_advisory_text_ur,
        confidence=advisory.confidence,
        source_weather_snapshot=advisory.source_weather_snapshot,
        generated_at=advisory.generated_at,
        disclaimer=DISCLAIMER,
    )


def _latest_advisory(trip):
    """Newest advisory for a trip, or None.

    Returns None when the relationship was never eager-loaded (e.g. a trip that was
    just created) instead of triggering a lazy load, which is illegal under asyncio.
    """
    if "advisories" in sa_inspect(trip).unloaded:
        return None
    if not trip.advisories:
        return None
    return sorted(trip.advisories, key=lambda a: a.generated_at, reverse=True)[0]


def _trip_to_out(trip, advisory=None) -> TripOut:
    latest = advisory or _latest_advisory(trip)
    adv_out: AdvisoryOut | None = _advisory_to_out(latest) if latest else None

    return TripOut(
        id=trip.id,
        user_id=trip.user_id,
        destination_id=trip.destination_id,
        start_date=trip.start_date,
        end_date=trip.end_date,
        traveler_profile=trip.traveler_profile,
        language=trip.language,
        created_at=trip.created_at,
        latest_advisory=adv_out,
    )


async def _generate_advisory_bg(trip_id: int) -> None:
    """Background task — generates the advisory after trip creation.

    Starlette runs background tasks while the request's dependency exit stack is
    still open, so anything raised here is thrown back into `get_db` and rolls
    back the very trip that was just created. The advisory is best-effort
    enrichment, so failures are logged and swallowed instead.
    """
    from app.db.session import async_session_factory

    async with async_session_factory() as db:
        try:
            svc = AdvisoryService(
                weather_provider=OpenMeteoProvider(),
                primary_ai=GroqProvider(),
                fallback_ai=GeminiProvider(),
                db=db,
            )
            await svc.generate_advisory(trip_id)
            await db.commit()
        except Exception:
            await db.rollback()
            logger.exception("Advisory generation failed for trip %s", trip_id)


async def _seed_trip_checklist(db: AsyncSession, trip) -> None:
    """Turn the places picked in the planner into the trip's visit checklist.

    Unknown ids, or ids belonging to another destination, are dropped rather than
    rejected: the checklist is an aid, and a stale client should not stop a trip
    from being created. `traveler_profile` is rewritten to the accepted subset so
    the advisory and gear recommenders stay consistent with the checklist.
    """
    profile = dict(trip.traveler_profile or {})
    requested: list[int] = []
    for raw in profile.get("selected_place_ids") or []:
        try:
            place_id = int(raw)
        except (TypeError, ValueError):
            continue
        if place_id not in requested:
            requested.append(place_id)
    if not requested:
        return

    valid = {
        place_id
        for (place_id,) in (
            await db.execute(
                select(Place.id).where(
                    Place.id.in_(requested),
                    Place.destination_id == trip.destination_id,
                )
            )
        ).all()
    }
    accepted = [place_id for place_id in requested if place_id in valid]
    for order, place_id in enumerate(accepted):
        db.add(TripPlace(trip_id=trip.id, place_id=place_id, sort_order=order))

    if accepted != requested:
        profile["selected_place_ids"] = accepted
        trip.traveler_profile = profile
    await db.flush()


@router.post(
    "",
    response_model=TripOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit)],
)
async def create_trip_endpoint(
    body: TripCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dest = await get_destination_by_id(db, body.destination_id)
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found.")

    trip = await create_trip(
        db,
        user_id=current_user.id,
        destination_id=body.destination_id,
        start_date=body.start_date,
        end_date=body.end_date,
        traveler_profile=body.traveler_profile,
        language=body.language,
    )

    await _seed_trip_checklist(db, trip)

    # Commit before the background task runs: it opens its own session, so an
    # uncommitted trip would be invisible to it. The session factory uses
    # expire_on_commit=False, so `trip` stays usable for the response.
    await db.commit()

    # Trigger advisory generation in the background
    background_tasks.add_task(_generate_advisory_bg, trip.id)

    return _trip_to_out(trip)


@router.get("", response_model=list[TripOut])
async def list_trips(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All trips belonging to the caller, newest first."""
    trips = await get_user_trips(db, current_user.id)
    return [_trip_to_out(trip) for trip in trips]


@router.get("/{trip_id}", response_model=TripOut)
async def get_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = await get_trip_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your trip.")
    return _trip_to_out(trip)


@router.get("/{trip_id}/offline-pack", response_model=OfflinePack)
async def get_offline_pack(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single JSON bundle for offline caching."""
    trip = await get_trip_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your trip.")

    adv_out: AdvisoryOut | None = None
    latest = _latest_advisory(trip)
    if latest:
        adv_out = _advisory_to_out(latest)

    trip_out = _trip_to_out(trip)

    vendors = await get_vendors_by_destination(db, trip.destination_id)
    vendor_dicts = [VendorOut.model_validate(v).model_dump() for v in vendors]

    return OfflinePack(trip=trip_out, advisory=adv_out, vendors=vendor_dicts)


@router.get("/{trip_id}/itinerary/pdf")
async def download_itinerary_pdf(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the itinerary + travel advisory as a downloadable PDF.

    This is the PDF counterpart to `/offline-pack` (which stays JSON, for
    in-app offline caching). Point the UI's "download" button at this route
    instead.
    """
    trip = await get_trip_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your trip.")

    advisory = _latest_advisory(trip)
    vendors = await get_vendors_by_destination(db, trip.destination_id)

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 25 * mm

    def line(text: str, size: int = 11, gap: int = 7) -> None:
        nonlocal y
        if y < 20 * mm:
            pdf.showPage()
            y = height - 25 * mm
        pdf.setFont("Helvetica", size)
        pdf.drawString(20 * mm, y, text)
        y -= gap * mm

    line(f"Trip Itinerary — Destination #{trip.destination_id}", size=16, gap=10)
    line(f"{trip.start_date} to {trip.end_date}")
    y -= 3 * mm

    if advisory:
        line("Safety Advisory", size=13, gap=8)
        for chunk in textwrap.wrap(advisory.safety_advisory_text or "N/A", 90):
            line(chunk)
        y -= 3 * mm

        line("Packing List", size=13, gap=8)
        for item in advisory.packing_list or []:
            line(f"- {item}")
        y -= 3 * mm

        line("Gear Checklist", size=13, gap=8)
        for item in advisory.gear_checklist or []:
            line(f"- {item}")
        y -= 3 * mm
    else:
        line("No advisory generated yet for this trip.")
        y -= 3 * mm

    line("Local Vendors", size=13, gap=8)
    if vendors:
        for vendor in vendors:
            line(f"- {vendor.name} ({vendor.type})")
    else:
        line("No vendors listed for this destination.")

    pdf.showPage()
    pdf.save()
    buffer.seek(0)

    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="trip_{trip_id}_itinerary.pdf"'},
    )
