"""Trail report endpoints — destination feed, global feed, submit, upvote."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.rate_limit import rate_limit
from app.crud.destination import get_destination_by_id
from app.crud.trail_report import (
    create_trail_report,
    get_recent_reports,
    get_report_by_id,
    get_reports_for_destination,
    upvote_report,
)
from app.db.session import get_db
from app.models.place import Place
from app.models.trail_report import TrailReport
from app.models.user import User
from app.schemas.trail_report import TrailReportCreate, TrailReportOut

router = APIRouter()


def _author_label(user: User | None) -> str:
    """Display name for a report author, never leaking the full email address."""
    if user is None:
        return "Traveler"
    if user.full_name:
        return user.full_name
    return user.email.split("@")[0]


def _to_out(
    report: TrailReport,
    author_name: str | None = None,
    destination_name: str | None = None,
    place_name: str | None = None,
) -> TrailReportOut:
    return TrailReportOut(
        id=report.id,
        destination_id=report.destination_id,
        place_id=report.place_id,
        user_id=report.user_id,
        report_text=report.report_text,
        condition=report.condition,
        upvote_count=report.upvote_count,
        created_at=report.created_at,
        author_name=author_name if author_name is not None else _author_label(report.user),
        destination_name=(
            destination_name
            if destination_name is not None
            else (report.destination.name if report.destination else None)
        ),
        place_name=(
            place_name
            if place_name is not None
            else (report.place.name if report.place else None)
        ),
    )


@router.get("/trail-reports", response_model=list[TrailReportOut])
async def list_recent_trail_reports(
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Global community feed used by the /community screen."""
    reports = await get_recent_reports(db, limit=limit)
    return [_to_out(r) for r in reports]


@router.get(
    "/destinations/{destination_id}/trail-reports",
    response_model=list[TrailReportOut],
)
async def list_trail_reports(
    destination_id: int,
    db: AsyncSession = Depends(get_db),
):
    reports = await get_reports_for_destination(db, destination_id)
    return [_to_out(r) for r in reports]


@router.post(
    "/trail-reports",
    response_model=TrailReportOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit)],
)
async def submit_trail_report(
    body: TrailReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    destination = await get_destination_by_id(db, body.destination_id)
    if destination is None:
        raise HTTPException(status_code=404, detail="Destination not found.")

    # A place-scoped report must actually belong to the destination it claims,
    # otherwise the community feed would attribute it to the wrong valley.
    place: Place | None = None
    if body.place_id is not None:
        place = await db.scalar(
            select(Place).where(
                Place.id == body.place_id,
                Place.destination_id == body.destination_id,
            )
        )
        if place is None:
            raise HTTPException(
                status_code=400,
                detail="That place does not belong to the selected destination.",
            )

    report = await create_trail_report(
        db,
        destination_id=body.destination_id,
        user_id=current_user.id,
        report_text=body.report_text,
        condition=body.condition,
        place_id=body.place_id,
    )
    # Pass names explicitly: the freshly created row has no relationships loaded.
    return _to_out(
        report,
        author_name=_author_label(current_user),
        destination_name=destination.name,
        place_name=place.name if place else None,
    )


@router.post(
    "/trail-reports/{report_id}/upvote",
    response_model=TrailReportOut,
    dependencies=[Depends(rate_limit)],
)
async def upvote_trail_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a report as helpful.

    Votes are not deduplicated per user (there is no votes table); the per-user
    rate limiter is what keeps this from being trivially inflated.
    """
    report = await get_report_by_id(db, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Trail report not found.")

    updated = await upvote_report(db, report)
    return _to_out(updated)
