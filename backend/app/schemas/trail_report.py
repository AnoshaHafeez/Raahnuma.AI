from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

TrailCondition = Literal["clear", "caution", "closed"]


class TrailReportCreate(BaseModel):
    destination_id: int
    place_id: Optional[int] = Field(
        default=None,
        description="Scope the report to one attraction of the destination.",
    )
    report_text: str = Field(min_length=1, max_length=2000)
    condition: TrailCondition = "clear"


class TrailReportOut(BaseModel):
    id: int
    destination_id: int
    place_id: Optional[int] = None
    user_id: int
    report_text: str
    condition: TrailCondition
    upvote_count: int
    created_at: datetime

    # Denormalised display fields so the client does not need extra lookups to
    # render a report card.
    author_name: Optional[str] = None
    destination_name: Optional[str] = None
    place_name: Optional[str] = None

    model_config = {"from_attributes": True}
