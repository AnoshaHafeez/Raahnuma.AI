"""Tests for auth endpoints."""

import pytest


@pytest.mark.asyncio
async def test_register_and_login(client):
    # Register
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "alice@example.com", "password": "secure123"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "alice@example.com"
    assert "id" in data

    # Duplicate registration should conflict
    resp2 = await client.post(
        "/api/v1/auth/register",
        json={"email": "alice@example.com", "password": "secure123"},
    )
    assert resp2.status_code == 409

    # Login
    resp3 = await client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "secure123"},
    )
    assert resp3.status_code == 200
    token_data = resp3.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # Bad credentials
    resp4 = await client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "wrong"},
    )
    assert resp4.status_code == 401
