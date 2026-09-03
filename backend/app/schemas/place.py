"""Schemas for destination attractions, AI top picks and the trip checklist."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PlacePickOut(BaseModel):
    """One entry of the AI "top picks" shortlist, with its grounding signals."""

    place_id: int
    name: str
    description: str
    activity_tags: list[str]
    popularity_rank: int | None
    community_rating: float | None
    review_count: int
    recent_mentions: int
    reason: str


class PlaceRecommendationOut(BaseModel):
    destination_id: int
    destination_name: str
    source: Literal["ai", "heuristic"] = Field(
        description="'heuristic' means both AI providers were unavailable and the "
        "ranking came from curated popularity plus community signals."
    )
    summary: str
    picks: list[PlacePickOut]
    generated_at: datetime


class TripPlaceOut(BaseModel):
    """A place on a trip's visit checklist."""

    id: int
    trip_id: int
    place_id: int
    name: str
    description: str
    activity_tags: list[str]
    popularity_rank: int | None
    visited: bool
    visited_at: datetime | None
    sort_order: int


class TripPlaceSelection(BaseModel):
    """Replaces a trip's whole checklist with this ordered list of places."""

    place_ids: list[int] = Field(default_factory=list, max_length=60)


class TripPlaceUpdate(BaseModel):
    visited: bool
