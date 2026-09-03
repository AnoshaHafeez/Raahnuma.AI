# Raahnuma.AI — Backend

AI-powered travel safety and planning assistant for Pakistan's northern tourism destinations (Hunza, Naran, Skardu).

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for local development without Docker)

### 1. Environment Setup

Copy the example env file and fill in your API keys:

```bash
cp .env.example .env
```

### 2. Run with Docker Compose

```bash
docker-compose up --build
```

This starts:
- **API** at `http://localhost:8000`
- **PostgreSQL** (with PostGIS) at `localhost:5432`
- **Redis** at `localhost:6379`

### 3. Run Migrations

```bash
# Inside the Docker container or locally:
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

### 4. Seed Demo Data

```bash
python seed_data.py
```

This seeds **Hunza**, **Naran**, and **Skardu** destinations with sample vendors.

The current catalogue also seeds a broader set of northern Pakistan destinations,
curated visitor stops, gear listings and day-based rental prices. Product and
place records include an `image_url` field; set those in `seed_data.py` to your
licensed Unsplash/owned URLs, then re-run the seed script on a fresh demo DB.

### 5. API Docs

Open [http://localhost:8000/docs](http://localhost:8000/docs) for the interactive Swagger UI.

## Obtaining API Keys

| Service | URL | Notes |
|---------|-----|-------|
| **Groq** (primary LLM) | https://console.groq.com | Free tier with generous limits |
| **Gemini** (fallback LLM) | https://aistudio.google.com | Free tier available |
| **Open-Meteo** (weather) | https://open-meteo.com | No API key required |
| **OSRM** (routing) | https://router.project-osrm.org | Public demo server, no key |
| **Nominatim** (geocoding) | https://nominatim.openstreetmap.org | Must set User-Agent header |
| **LibreTranslate** | https://libretranslate.com | Optional, for non-LLM translation |

## Running Tests

```bash
pip install -r requirements.txt
pytest
```

Tests use an SQLite database and mock all external HTTP calls — no real API keys needed.

## Architecture

### Adapter Pattern

Every external service sits behind an **abstract base class** in `services/<domain>/base.py`:

```
services/
├── weather/
│   ├── base.py            # WeatherProvider ABC
│   └── open_meteo.py      # Concrete: OpenMeteoProvider
├── ai/
│   ├── base.py            # AIProvider ABC
│   ├── groq_provider.py   # Primary LLM
│   ├── gemini_provider.py # Fallback LLM
│   └── advisory_service.py# Orchestration
├── routing/
│   ├── base.py            # RoutingProvider ABC
│   └── osrm_provider.py   # OSRM + Nominatim
├── translation/
│   ├── base.py            # TranslationProvider ABC
│   └── libre_translate.py # LibreTranslate
└── notification/
    └── fcm.py             # FCM stub
```

**Why?** Free-tier limits on these providers change without warning. Swapping a provider (e.g., Groq → another OpenAI-compatible LLM) is a **one-file change** — create a new concrete class, and update the FastAPI dependency. Endpoints and services depend only on the abstract interface.

### Key Design Decisions

- **Grounded AI**: The LLM prompt includes ONLY real fetched data (weather, known hazards). The system prompt explicitly tells the model not to guess.
- **Mandatory Disclaimer**: Every advisory response includes: *"AI-generated guidance — always confirm current conditions locally before travel."*
- **SOS is client-side**: The `/sos` endpoint prepares a share-ready payload (contacts, map link, message) but does NOT send anything. The actual SMS/WhatsApp share happens via the phone's native share sheet.
- **PostGIS trade-off**: This version uses plain lat/lng floats. PostGIS geography columns can be enabled by switching the column types in the models — the infrastructure (PostGIS Docker image) is already in place.
- **No background location tracking**: Location data is only written when a user explicitly triggers an action.

## Folder Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── core/                 # Config, security, cache, rate limiter
│   ├── api/v1/endpoints/     # Route handlers
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic request/response schemas
│   ├── services/             # External service adapters (ABC pattern)
│   ├── crud/                 # Database access functions
│   ├── db/                   # Engine, session, base class
│   └── tests/                # Test suite
├── alembic/                  # Database migrations
├── seed_data.py              # Seed script for demo data
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

## API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | Register new user |
| POST | `/api/v1/auth/login` | No | Get JWT token |
| GET | `/api/v1/destinations` | No | List all destinations |
| GET | `/api/v1/destinations/{id}` | No | Destination detail |
| GET | `/api/v1/weather/{destination_id}` | No | Current weather |
| POST | `/api/v1/trips` | Yes | Create trip (triggers advisory) |
| GET | `/api/v1/trips/{id}` | Yes | Trip detail + latest advisory |
| POST | `/api/v1/trips/{id}/regenerate-advisory` | Yes | Force fresh advisory |
| GET | `/api/v1/trips/{id}/offline-pack` | Yes | Offline bundle |
| GET | `/api/v1/destinations/{id}/vendors` | No | List vendors |
| POST | `/api/v1/vendors` | Yes | Create vendor (admin) |
| GET | `/api/v1/destinations/{id}/places` | No | Curated visitor stops and available community feedback |
| GET | `/api/v1/marketplace/products` | No | Real gear catalogue and prices |
| GET | `/api/v1/trips/{id}/gear-recommendations` | Yes | Itinerary-aware gear matches |
| POST | `/api/v1/orders` | Yes | Server-priced Cash on Delivery order |
| POST | `/api/v1/sos` | Yes | Trigger SOS |
| GET | `/api/v1/emergency-contacts` | Yes | List contacts |
| POST | `/api/v1/emergency-contacts` | Yes | Add contact |
| GET | `/api/v1/destinations/{id}/trail-reports` | No | Trail reports |
| POST | `/api/v1/trail-reports` | Yes | Submit trail report |
