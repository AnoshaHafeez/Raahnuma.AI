# Raahnuma.AI

Raahnuma.AI is a trip-planning and travel-safety application for Pakistan's northern destinations. It turns a traveller's destination and selected places into a live safety brief, a practical packing checklist, and an itinerary-aware marketplace.

## What it does

- Plans trips around curated destinations and selectable points of interest.
- Generates grounded AI safety guidance and packing recommendations.
- Shows weather-aware, trip-specific marketplace suggestions before the full gear catalogue.
- Lets travellers rent or buy verified local gear and submit cash-on-delivery orders.
- Provides a community trail-report feed and an SOS share flow.
- Delivers responsive in-app notifications for active-trip weather, community reports, and matching gear.

## Repository layout

```text
Raahnuma.AI/
├── frontend/        Next.js 14, TypeScript, Tailwind CSS, Redux Toolkit
├── backend/         FastAPI, SQLAlchemy async, Alembic, PostgreSQL
├── docs/            Operational documentation
└── render.yaml      Render Blueprint for the production API and database
```

## Local development

### Prerequisites

- Node.js 18.17 or newer
- Python 3.11 or newer
- PostgreSQL (or the included Docker Compose stack)
- Optional: Redis, used for cache and rate limiting. The API safely continues without it during development.

### Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env  # use cp on macOS/Linux
alembic upgrade head
python seed_data.py
uvicorn app.main:app --reload --port 8000
```

For the complete local API stack (PostgreSQL, Redis, and FastAPI), run `docker-compose up --build` from `backend/` instead. API documentation is available at `http://localhost:8000/docs` in development.

### Frontend

```bash
cd frontend
copy .env.local.example .env.local  # use cp on macOS/Linux
npm install
npm run dev
```

Open `http://localhost:3000`. Set `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` when the API does not run at `http://localhost:8000`.

## Environment variables

The checked-in examples are the source of truth:

- `backend/.env.example` — database, CORS, JWT, AI providers, cache and service configuration.
- `frontend/.env.local.example` — public FastAPI origin used by the browser and Next.js image optimizer.

Never commit `.env`, `.env.local`, database dumps, or API keys. `NEXT_PUBLIC_*` values are intentionally exposed to the browser; only use them for public configuration such as the API origin.

## Key application flows

### Trip planning

The trip form displays three selectable AI picks first. `Explore all other places` then shows the remaining locations, so the same choices are never repeated. Selections are saved with the trip and provide the activity context for safety and gear suggestions.

### Marketplace recommendations

The marketplace selector lets a user switch among their trips. The API matches the selected trip's places and activity tags to available local products; the top matches appear before filters and the full catalogue. Filters and search remain available below.

### Notifications

The notification bell is responsive and opens a YouTube-style dropdown. It derives updates from the user's active trip, weather snapshot, community reports, and the trip gear-recommendations endpoint. It is deliberately informational: users must still verify road and weather conditions locally.

### Static gear images

Gear assets are stored in `backend/gear/` and served by FastAPI at `/static/gear`. Product records carry relative static paths; the frontend resolves them using `NEXT_PUBLIC_API_BASE_URL`.

## Quality checks

```bash
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd backend
pytest
```

## Deployment

Use Vercel for `frontend/` and Render for the FastAPI API and PostgreSQL database. The full, ordered setup—including CORS and production image configuration—is in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Safety and production notes

- AI output is guidance, not a guarantee. The product keeps the advisory disclaimer visible and uses known hazards plus live weather as grounding.
- Use a long, generated `JWT_SECRET_KEY` in production.
- Configure `CORS_ORIGINS` with exact frontend origins only.
- The public OSRM and Nominatim services are suitable for demos; production traffic should use managed or self-hosted alternatives that meet their respective usage policies.
