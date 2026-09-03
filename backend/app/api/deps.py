"""Shared auth dependency — extract and validate JWT from request."""

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.crud.user import get_user_by_id
from app.db.session import get_db
from app.models.user import User


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract JWT from Authorization header and return the authenticated User."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
        )
    token = auth_header.removeprefix("Bearer ").strip()
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    user_id_raw = payload.get("sub")
    try:
        user_id = int(user_id_raw)
    except (TypeError, ValueError):
        # A token with a missing/non-numeric subject is malformed, not a server fault.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject.",
        ) from None

    user = await get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    # Attach user id to request state for rate limiter
    request.state.user_id = user.id
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Guard write endpoints that curate shared catalogue data (e.g. vendors)."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required.",
        )
    return current_user
