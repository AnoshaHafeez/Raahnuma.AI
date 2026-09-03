"""Advisory regeneration endpoint."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.rate_limit import rate_limit
from app.crud.trip import get_trip_by_id
from app.db.session import get_db
from app.models.user import User
from app.schemas.trip import AdvisoryOut
from app.services.ai.advisory_service import AdvisoryService, DISCLAIMER
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.groq_provider import GroqProvider
from app.services.weather.open_meteo import OpenMeteoProvider

router = APIRouter()


@router.post(
    "/{trip_id}/regenerate-advisory",
    response_model=AdvisoryOut,
    dependencies=[Depends(rate_limit)],
)
async def regenerate_advisory(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = await get_trip_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your trip.")

    svc = AdvisoryService(
        weather_provider=OpenMeteoProvider(),
        primary_ai=GroqProvider(),
        fallback_ai=GeminiProvider(),
        db=db,
    )

    try:
        advisory = await svc.generate_advisory(trip_id, bypass_cache=True)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )

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
