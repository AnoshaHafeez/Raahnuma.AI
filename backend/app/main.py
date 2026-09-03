"""Raahnuma.AI — FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_v1_router
from app.core.cache import close_redis
from app.core.config import settings

logger = logging.getLogger(__name__)


def _verify_runtime_secrets() -> None:
    """Refuse to boot a production deployment with placeholder credentials."""
    if settings.jwt_secret_key in ("", "changeme"):
        message = (
            "JWT_SECRET_KEY is unset or still the placeholder value. "
            "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
        )
        if settings.is_production:
            raise RuntimeError(message)
        logger.warning("%s (allowed because ENVIRONMENT=%s)", message, settings.environment)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    _verify_runtime_secrets()
    yield
    # Shutdown
    await close_redis()


# The interactive docs enumerate every route and schema, so they stay off in
# production. Unchanged for development and staging.
_docs_enabled = not settings.is_production

app = FastAPI(
    title="Raahnuma.AI",
    description="AI-powered travel safety and planning assistant for Pakistan's northern tourism.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

app.mount(
    "/static/gear",
    StaticFiles(directory=Path(__file__).resolve().parent.parent / "gear"),
    name="gear",
)

# Explicit allowlist from CORS_ORIGINS. A wildcard cannot be combined with
# allow_credentials, and the API authenticates via the Authorization header
# rather than cookies, so credentials are not needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)

app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
