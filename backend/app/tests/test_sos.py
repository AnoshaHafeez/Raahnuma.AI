"""Tests for SOS endpoints."""

import pytest


@pytest.mark.asyncio
async def test_sos_requires_auth(client):
    resp = await client.post(
        "/api/v1/sos",
        json={"latitude": 36.32, "longitude": 74.88},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_emergency_contacts_crud(auth_client):
    # Create a contact
    resp = await auth_client.post(
        "/api/v1/emergency-contacts",
        json={"name": "Mom", "phone_number": "+92-300-1234567"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Mom"
    assert data["phone_number"] == "+92-300-1234567"

    # List contacts
    resp2 = await auth_client.get("/api/v1/emergency-contacts")
    assert resp2.status_code == 200
    contacts = resp2.json()
    assert len(contacts) == 1
    assert contacts[0]["name"] == "Mom"


@pytest.mark.asyncio
async def test_sos_flow(auth_client):
    # Add emergency contact first
    await auth_client.post(
        "/api/v1/emergency-contacts",
        json={"name": "Dad", "phone_number": "+92-300-9876543"},
    )

    # Trigger SOS
    resp = await auth_client.post(
        "/api/v1/sos",
        json={"latitude": 36.32, "longitude": 74.88},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "sos_event_id" in data
    assert len(data["contacts"]) == 1
    assert data["contacts"][0]["name"] == "Dad"
    assert "openstreetmap.org" in data["maps_link"]
    assert "EMERGENCY" in data["prefilled_message"]


@pytest.mark.asyncio
async def test_sos_with_missing_trip_returns_not_found(auth_client):
    """An invalid optional trip reference must not become a database 500."""
    resp = await auth_client.post(
        "/api/v1/sos",
        json={"latitude": 36.32, "longitude": 74.88, "trip_id": 1},
    )

    assert resp.status_code == 404
    assert resp.json()["detail"] == "Trip not found."
