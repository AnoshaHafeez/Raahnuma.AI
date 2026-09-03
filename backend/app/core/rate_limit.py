"""Simple Redis-backed rate limiter as a FastAPI dependency."""

from __future__ import annotations

import logging
import time

from fastapi import Depends, HTTPException, Request, status

from app.api.deps import get_current_user
from app.core.cache import get_redis
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)


async def rate_limit(
    request: Request,
    current_user: User = Depends(get_current_user),
) -> None:
    """Sliding-window rate limiter. Apply as a Depends() on sensitive endpoints."""
    r = await get_redis()

    # Key on the authenticated user's id (resolved via sub-dependency).
    key_id = f"ratelimit:{current_user.id}"

    now = time.time()
    window = 60  # 1-minute window

    pipe = r.pipeline()
    # Remove entries outside the window
    pipe.zremrangebyscore(key_id, 0, now - window)
    # Count remaining entries
    pipe.zcard(key_id)
    # Add current request
    pipe.zadd(key_id, {str(now): now})
    # Set expiry on the key itself
    pipe.expire(key_id, window)
    results = await pipe.execute()

    request_count: int = results[1]
    if request_count >= settings.rate_limit_per_minute:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
        )


def _client_ip(request: Request) -> str:
    """Best-effort client IP.

    ``X-Forwarded-For`` is only trusted when the app runs behind a proxy that is
    known to set it; otherwise a caller could spoof the header to dodge the limit.
    """
    if settings.trust_proxy_headers:
        forwarded = request.headers.get("X-Forwarded-For", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def auth_rate_limit(request: Request) -> None:
    """Throttle unauthenticated auth attempts per client IP to blunt credential stuffing.

    Deliberately *fails open*: if Redis is unreachable we log and allow the request
    rather than locking every user out of the product. Brute-force protection is a
    defence-in-depth measure here, not the primary control (that is bcrypt hashing).
    """
    key_id = f"ratelimit:auth:{_client_ip(request)}"
    window = 60

    try:
        r = await get_redis()
        now = time.time()
        pipe = r.pipeline()
        pipe.zremrangebyscore(key_id, 0, now - window)
        pipe.zcard(key_id)
        pipe.zadd(key_id, {str(now): now})
        pipe.expire(key_id, window)
        results = await pipe.execute()
        request_count = int(results[1])
    except Exception:  # noqa: BLE001 - availability over strictness, see docstring
        logger.warning("Auth rate limiter unavailable; allowing request", exc_info=True)
        return

    if request_count >= settings.auth_rate_limit_per_minute:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please wait a minute and try again.",
        )
