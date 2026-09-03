"""Test that rate limiting is per-user, not per-IP.

Proves that two different authenticated users each get their own rate-limit
budget — exhausting user A's limit does NOT affect user B.
"""

import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch

from app.core.config import settings
from app.core.rate_limit import rate_limit
from app.main import app


async def _make_auth_client(email: str, password: str) -> AsyncClient:
    """Register + login a user and return a client with their auth header."""
    transport = ASGITransport(app=app)
    client = AsyncClient(transport=transport, base_url="http://test")
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest.mark.asyncio
async def test_rate_limit_is_per_user_not_per_ip():
    """Two users from the same IP (localhost in tests) must have independent budgets."""
    call_counts: dict[str, int] = {}

    class FakePipelineWrapper:
        def __init__(self):
            self._key = None

        def zremrangebyscore(self, key, *args, **kwargs):
            self._key = key

        def zcard(self, key, *args, **kwargs):
            pass

        def zadd(self, key, *args, **kwargs):
            pass

        def expire(self, key, *args, **kwargs):
            pass

        async def execute(self):
            count = call_counts.get(self._key, 0)
            call_counts[self._key] = count + 1
            return [None, count, True, True]

    class FakeRedis:
        def pipeline(self):
            return FakePipelineWrapper()

    fake_redis = FakeRedis()

    # Temporarily remove the no-op override so the real rate limiter runs,
    # with our fake Redis patched in.
    original_override = app.dependency_overrides.pop(rate_limit, None)

    with patch("app.core.rate_limit.get_redis", new=AsyncMock(return_value=fake_redis)):
        client_a = await _make_auth_client("userA@test.com", "passA123")
        client_b = await _make_auth_client("userB@test.com", "passB123")

        original_limit = settings.rate_limit_per_minute
        settings.rate_limit_per_minute = 3

        try:
            # Exhaust user A's rate limit (3 requests)
            for _ in range(3):
                await client_a.post(
                    "/api/v1/trips",
                    json={
                        "destination_id": 1,
                        "start_date": "2026-07-01",
                        "end_date": "2026-07-05",
                    },
                )

            # User A's 4th request should be rate-limited
            resp_blocked = await client_a.post(
                "/api/v1/trips",
                json={
                    "destination_id": 1,
                    "start_date": "2026-07-01",
                    "end_date": "2026-07-05",
                },
            )
            assert resp_blocked.status_code == 429, (
                "User A should be rate-limited after 3 requests"
            )

            # User B should NOT be blocked (separate budget)
            resp_b = await client_b.post(
                "/api/v1/trips",
                json={
                    "destination_id": 1,
                    "start_date": "2026-07-01",
                    "end_date": "2026-07-05",
                },
            )
            assert resp_b.status_code != 429, (
                "User B should NOT be rate-limited — budgets must be independent"
            )

        finally:
            settings.rate_limit_per_minute = original_limit
            # Restore the override for other tests
            if original_override is not None:
                app.dependency_overrides[rate_limit] = original_override
            await client_a.aclose()
            await client_b.aclose()
