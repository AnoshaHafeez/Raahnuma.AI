from functools import cached_property

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Runtime
    environment: str = "development"  # development | staging | production

    # Database
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/raahnuma"

    @field_validator("database_url", mode="before")
    @classmethod
    def use_asyncpg_driver(cls, value: object) -> str:
        """Accept provider Postgres URLs while keeping SQLAlchemy async-only."""
        url = str(value)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # CORS — comma-separated list of allowed frontend origins.
    # Stored as a plain string so pydantic-settings does not try to JSON-decode it.
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Set to true only when running behind a proxy/load balancer that overwrites
    # X-Forwarded-For; otherwise clients could spoof it to evade rate limits.
    trust_proxy_headers: bool = False

    # JWT
    jwt_secret_key: str = "changeme"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Groq (primary LLM)
    groq_api_key: str = ""
    # Groq retires older models without notice and answers 404 for them, which
    # silently disables advisory generation. Verify against GET /openai/v1/models
    # when advisories start coming back empty.
    groq_model: str = "openai/gpt-oss-120b"

    # Gemini (fallback LLM)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # Routing / Geocoding
    osrm_base_url: str = "https://router.project-osrm.org"
    nominatim_base_url: str = "https://nominatim.openstreetmap.org"
    nominatim_user_agent: str = "RaahnumaAI/1.0 (hackathon-contact@example.com)"

    # Translation
    libretranslate_url: str = "https://libretranslate.com"
    libretranslate_api_key: str = ""

    # Rate limiting & caching
    rate_limit_per_minute: int = 30
    auth_rate_limit_per_minute: int = 10
    weather_cache_ttl_seconds: int = 3600
    advisory_cache_ttl_seconds: int = 3600

    @cached_property
    def cors_origins_list(self) -> list[str]:
        """Parsed, de-duplicated CORS allowlist."""
        seen: dict[str, None] = {}
        for origin in self.cors_origins.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned:
                seen.setdefault(cleaned, None)
        return list(seen)

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


settings = Settings()
