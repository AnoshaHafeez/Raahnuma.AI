"""Async Redis client with get/set-with-TTL helpers."""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    """Return a shared async Redis connection (created lazily)."""
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


async def cache_get(key: str) -> Optional[Any]:
    """Retrieve a JSON-serialisable value from cache.

    Returns None both for a cache miss and for a cache outage: the cache is an
    optimisation, so losing Redis must not turn into a failed request.
    """
    try:
        r = await get_redis()
        raw = await r.get(key)
    except Exception:  # noqa: BLE001 - degrade to a cache miss
        logger.warning("Cache read failed for key %s", key, exc_info=True)
        return None

    if raw is None:
        return None
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return raw


async def cache_set(key: str, value: Any, ttl: int) -> None:
    """Store a JSON-serialisable value with a TTL in seconds. Never raises."""
    try:
        r = await get_redis()
        serialised = json.dumps(value) if not isinstance(value, str) else value
        await r.set(key, serialised, ex=ttl)
    except Exception:  # noqa: BLE001 - caching is best-effort
        logger.warning("Cache write failed for key %s", key, exc_info=True)


async def cache_delete(key: str) -> None:
    try:
        r = await get_redis()
        await r.delete(key)
    except Exception:  # noqa: BLE001 - caching is best-effort
        logger.warning("Cache delete failed for key %s", key, exc_info=True)
