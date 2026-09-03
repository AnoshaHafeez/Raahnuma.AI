"""Destination attractions, AI top picks, and the per-trip visit checklist."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.place import Place
from app.models.trip import Trip
from app.models.trip_place import TripPlace
from app.models.user import User
from app.schemas.marketplace import PlaceOut
from app.schemas.place import (
    PlaceRecommendationOut,
    TripPlaceOut,
    TripPlaceSelection,
    TripPlaceUpdate,
)
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.groq_provider import GroqProvider
from app.services.ai.place_recommender import PlaceRecommender

router = APIRouter()


def _trip_place_out(row: TripPlace) -> TripPlaceOut:
    place = row.place
    return TripPlaceOut(
        id=row.id,
        trip_id=row.trip_id,
        place_id=row.place_id,
        name=place.name,
        description=place.description or "",
        activity_tags=list(place.activity_tags or []),
        popularity_rank=place.popularity_rank,
        visited=row.visited,
        visited_at=row.visited_at,
        sort_order=row.sort_order,
    )


async def _owned_trip(trip_id: int, db: AsyncSession, user: User) -> Trip:
    trip = await db.scalar(select(Trip).where(Trip.id == trip_id))
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if trip.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your trip.")
    return trip


async def _checklist(trip_id: int, db: AsyncSession) -> list[TripPlaceOut]:
    rows = (
        await db.execute(
            select(TripPlace)
            .options(selectinload(TripPlace.place))
            .where(TripPlace.trip_id == trip_id)
            .order_by(TripPlace.sort_order, TripPlace.id)
        )
    ).scalars()
    return [_trip_place_out(row) for row in rows]


@router.get("/destinations/{destination_id}/places", response_model=list[PlaceOut])
async def list_places(destination_id: int, db: AsyncSession = Depends(get_db)):
    """Every catalogued area of a destination, most visited first.

    Unranked places sort after ranked ones — COALESCE rather than NULLS LAST so
    the ordering behaves identically on SQLite (tests) and Postgres.
    """
    result = await db.execute(
        select(Place)
        .where(Place.destination_id == destination_id)
        .order_by(Place.popularity_rank.is_(None), Place.popularity_rank, Place.name)
    )
    return list(result.scalars())


@router.get(
    "/destinations/{destination_id}/place-recommendations",
    response_model=PlaceRecommendationOut,
)
async def place_recommendations(
    destination_id: int,
    limit: int = Query(default=5, ge=1, le=10),
    db: AsyncSession = Depends(get_db),
):
    """AI top picks for a destination, grounded in curated and community data."""
    recommender = PlaceRecommender(
        db=db,
        primary_ai=GroqProvider(),
        fallback_ai=GeminiProvider(),
    )
    try:
        return await recommender.recommend(destination_id, limit=limit)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/trips/{trip_id}/places", response_model=list[TripPlaceOut])
async def list_trip_places(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _owned_trip(trip_id, db, current_user)
    return await _checklist(trip_id, db)


@router.put("/trips/{trip_id}/places", response_model=list[TripPlaceOut])
async def set_trip_places(
    trip_id: int,
    body: TripPlaceSelection,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Replace the trip checklist, keeping the visited state of retained places."""
    trip = await _owned_trip(trip_id, db, current_user)

    # De-duplicate while preserving the order the traveller picked.
    wanted: list[int] = []
    for place_id in body.place_ids:
        if place_id not in wanted:
            wanted.append(place_id)

    if wanted:
        valid = {
            place_id
            for (place_id,) in (
                await db.execute(
                    select(Place.id).where(
                        Place.id.in_(wanted),
                        Place.destination_id == trip.destination_id,
                    )
                )
            ).all()
        }
        unknown = [place_id for place_id in wanted if place_id not in valid]
        if unknown:
            raise HTTPException(
                status_code=400,
                detail="One or more places do not belong to this trip's destination.",
            )

    existing = {
        row.place_id: row
        for row in (
            await db.execute(select(TripPlace).where(TripPlace.trip_id == trip_id))
        ).scalars()
    }

    for place_id, row in existing.items():
        if place_id not in wanted:
            await db.delete(row)

    for order, place_id in enumerate(wanted):
        row = existing.get(place_id)
        if row is None:
            db.add(TripPlace(trip_id=trip_id, place_id=place_id, sort_order=order))
        else:
            row.sort_order = order

    # Keep traveler_profile in step: the advisory and gear recommenders read the
    # selected places from there.
    profile = dict(trip.traveler_profile or {})
    profile["selected_place_ids"] = wanted
    trip.traveler_profile = profile

    await db.flush()
    return await _checklist(trip_id, db)


@router.patch("/trips/{trip_id}/places/{place_id}", response_model=TripPlaceOut)
async def update_trip_place(
    trip_id: int,
    place_id: int,
    body: TripPlaceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tick a place off (or back on) the checklist."""
    await _owned_trip(trip_id, db, current_user)
    row = await db.scalar(
        select(TripPlace)
        .options(selectinload(TripPlace.place))
        .where(TripPlace.trip_id == trip_id, TripPlace.place_id == place_id)
    )
    if row is None:
        raise HTTPException(status_code=404, detail="That place is not on this trip.")
    row.visited = body.visited
    row.visited_at = datetime.now(timezone.utc) if body.visited else None
    await db.flush()
    return _trip_place_out(row)


@router.delete("/trips/{trip_id}/places/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_trip_place(
    trip_id: int,
    place_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = await _owned_trip(trip_id, db, current_user)
    row = await db.scalar(
        select(TripPlace).where(TripPlace.trip_id == trip_id, TripPlace.place_id == place_id)
    )
    if row is None:
        raise HTTPException(status_code=404, detail="That place is not on this trip.")
    await db.delete(row)
    profile = dict(trip.traveler_profile or {})
    profile["selected_place_ids"] = [
        value for value in (profile.get("selected_place_ids") or []) if value != place_id
    ]
    trip.traveler_profile = profile
    await db.flush()
