"""Shared test fixtures — async test DB, test client, and auth helpers."""

from __future__ import annotations

import asyncio
from typing import AsyncGenerator

from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.cache import close_redis
from app.core.rate_limit import rate_limit
from app.db.base import Base
from app.db.session import get_db

# Import all models so Base.metadata knows about them for create_all.
from app.models import (  # noqa: F401
    advisory,
    destination,
    emergency_contact,
    sos_event,
    trail_report,
    trip,
    trip_place,
    user,
    vendor,
    place,
    product,
    order,
)

# In-memory SQLite, so a run can never inherit rows from a previous one.
#
# This was previously "sqlite+aiosqlite:///./test.db". A file-backed DB resolved
# relative to the current working directory meant that any interrupted run left
# a populated test.db behind, and the next run then failed with confusing errors
# (register returning 409 because test@example.com already existed).
#
# StaticPool is required: ":memory:" is normally per-connection, so without it
# every checkout would see a different, empty database.
TEST_DATABASE_URL = "sqlite+aiosqlite://"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)
test_session_factory = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create all tables before each test and drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(autouse=True)
async def _reset_redis_between_tests():
    """Reset the cached Redis client after every test to prevent stale connections.
    Also patches cache_get/cache_set/cache_delete globally so no real Redis is needed."""
    with patch("app.core.cache.get_redis") as mock_get_redis, \
         patch("app.services.weather.open_meteo.cache_set", new=AsyncMock()), \
         patch("app.services.weather.open_meteo.cache_get", new=AsyncMock(return_value=None)):
        yield
    await close_redis()


async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with test_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = _override_get_db


async def _noop_rate_limit():
    """No-op rate limiter for tests — no Redis required."""
    pass


app.dependency_overrides[rate_limit] = _noop_rate_limit


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient) -> AsyncClient:
    """Register a test user and return a client with a valid auth header."""
    await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "testpass123"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpass123"},
    )
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client
