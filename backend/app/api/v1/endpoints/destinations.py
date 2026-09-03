"""Destination endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.destination import get_all_destinations, get_destination_by_id
from app.db.session import get_db
from app.schemas.destination import DestinationOut

router = APIRouter()


@router.get("", response_model=list[DestinationOut])
async def list_destinations(db: AsyncSession = Depends(get_db)):
    return await get_all_destinations(db)


@router.get("/{dest_id}", response_model=DestinationOut)
async def get_destination(dest_id: int, db: AsyncSession = Depends(get_db)):
    dest = await get_destination_by_id(db, dest_id)
    if not dest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Destination not found.")
    return dest
