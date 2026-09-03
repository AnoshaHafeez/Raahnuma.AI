from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel


class TripCreate(BaseModel):
    destination_id: int
    start_date: date
    end_date: date
    traveler_profile: dict[str, Any] = {}
    language: str = "en"


class AdvisoryOut(BaseModel):
    id: int
    packing_list: list[str]
    gear_checklist: list[str]
    safety_advisory_text: str
    safety_advisory_text_ur: str
    confidence: str
    source_weather_snapshot: dict[str, Any]
    generated_at: datetime
    disclaimer: str = "AI-generated guidance — always confirm current conditions locally before travel."

    model_config = {"from_attributes": True}


class TripOut(BaseModel):
    id: int
    user_id: int
    destination_id: int
    start_date: date
    end_date: date
    traveler_profile: dict[str, Any]
    language: str
    created_at: datetime
    latest_advisory: AdvisoryOut | None = None

    model_config = {"from_attributes": True}


class OfflinePack(BaseModel):
    trip: TripOut
    advisory: AdvisoryOut | None
    vendors: list[dict[str, Any]]
