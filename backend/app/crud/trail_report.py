"""CRUD operations for TrailReport entity."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.trail_report import TrailReport


def _with_relations():
    """Eager-load the author and destination (the API returns their names).

    Built on each call rather than at module import: constructing a loader option
    triggers mapper configuration, which fails while models are still importing.
    """
    return (
        selectinload(TrailReport.user),
        selectinload(TrailReport.destination),
        selectinload(TrailReport.place),
    )


async def get_reports_for_destination(
    db: AsyncSession, destination_id: int
) -> list[TrailReport]:
    result = await db.execute(
        select(TrailReport)
        .options(*_with_relations())
        .where(TrailReport.destination_id == destination_id)
        .order_by(TrailReport.created_at.desc())
    )
    return list(result.scalars().all())


async def get_recent_reports(db: AsyncSession, limit: int = 50) -> list[TrailReport]:
    """Global community feed across all destinations, newest first."""
    result = await db.execute(
        select(TrailReport)
        .options(*_with_relations())
        .order_by(TrailReport.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_report_by_id(db: AsyncSession, report_id: int) -> Optional[TrailReport]:
    result = await db.execute(
        select(TrailReport)
        .options(*_with_relations())
        .where(TrailReport.id == report_id)
    )
    return result.scalar_one_or_none()


async def create_trail_report(
    db: AsyncSession,
    destination_id: int,
    user_id: int,
    report_text: str,
    condition: str = "clear",
    place_id: Optional[int] = None,
) -> TrailReport:
    report = TrailReport(
        destination_id=destination_id,
        place_id=place_id,
        user_id=user_id,
        report_text=report_text,
        condition=condition,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


async def upvote_report(db: AsyncSession, report: TrailReport) -> TrailReport:
    report.upvote_count = (report.upvote_count or 0) + 1
    await db.flush()
    await db.refresh(report)
    return report
