"""Aggregates all v1 endpoint routers into a single router."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    advisory,
    auth,
    destinations,
    marketplace,
    places,
    sos,
    trail_reports,
    trips,
    vendors,
    weather,
)

api_v1_router = APIRouter()

api_v1_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_v1_router.include_router(destinations.router, prefix="/destinations", tags=["destinations"])
api_v1_router.include_router(weather.router, prefix="/weather", tags=["weather"])
api_v1_router.include_router(trips.router, prefix="/trips", tags=["trips"])
api_v1_router.include_router(advisory.router, prefix="/trips", tags=["advisory"])
api_v1_router.include_router(vendors.router, tags=["vendors"])
api_v1_router.include_router(marketplace.router, tags=["marketplace"])
api_v1_router.include_router(places.router, tags=["places"])
api_v1_router.include_router(sos.router, tags=["sos"])
api_v1_router.include_router(trail_reports.router, tags=["trail_reports"])
