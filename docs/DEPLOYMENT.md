# Deployment guide

This project deploys best as two services:

- **Frontend:** Vercel, with `frontend/` as the project root.
- **API and database:** Render, using the root `render.yaml` Blueprint.

## 1. Commit the required files

Before deploying, commit the entire `backend/gear/` directory. Those images are served directly by FastAPI, so leaving them untracked will produce broken marketplace cards in production.

Also commit `render.yaml`, `frontend/next.config.js`, and the frontend source changes. Do not commit `backend/.env` or `frontend/.env.local`.

## 2. Deploy the backend on Render

1. Push this repository to GitHub.
2. In Render, choose **New +** → **Blueprint** and select the repository.
3. Render finds the root `render.yaml` and creates:
   - `raahnuma-api` — FastAPI web service
   - `raahnuma-db` — PostgreSQL database
4. During setup, provide `CORS_ORIGINS` temporarily as `https://your-project.vercel.app`. You can update it once Vercel gives you the final domain.
5. Provide `GROQ_API_KEY` and/or `GEMINI_API_KEY` if you want generated AI advisories. They can be left blank for a non-AI demo; trip creation continues safely.
6. Deploy. The Blueprint runs Alembic migrations before starting Uvicorn.
7. Open `https://<your-render-service>.onrender.com/health`; it should return `{"status":"ok"}`.

The Blueprint generates a strong `JWT_SECRET_KEY` automatically. Render Blueprints support database connection references, generated values, and `sync: false` values for secrets; use the dashboard to set all actual secret values. [Render Blueprint reference](https://render.com/docs/blueprint-spec)

### Seed the production catalogue

Migrations create tables but do not add demo destinations and products. After the first deployment, open the Render service shell and run:

```bash
python seed_data.py
```

Run it once per environment. The seed script is idempotent and fills blank image URLs without overwriting existing non-empty ones.

## 3. Deploy the frontend on Vercel

1. In Vercel, import the same GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Add this Production environment variable before the first build:

```text
NEXT_PUBLIC_API_BASE_URL=https://<your-render-service>.onrender.com
```

4. Deploy and copy the final Vercel domain.
5. Back in Render, set `CORS_ORIGINS` to that exact origin, for example:

```text
https://raahnuma-ai.vercel.app
```

For preview deployments, add each preview origin if you need the browser to call the API from that preview. Restart/redeploy the API after changing CORS.

The frontend's image configuration reads `NEXT_PUBLIC_API_BASE_URL` at build time and permits only that host for `/static/gear/**`. This is why setting the variable before Vercel builds is essential.

Vercel supports deploying an existing Next.js project from its configured root directory, and environment variables apply per deployment environment. [Vercel Next.js deployment](https://vercel.com/docs/frameworks/full-stack/nextjs), [Vercel environment variables](https://vercel.com/docs/environment-variables)

## 4. Production checklist

- Confirm `GET /health` returns `200`.
- Confirm `https://<api>/docs` is unavailable in production; this is intentional.
- Register a test user, create a trip, and ensure the safety advisory completes.
- Open Marketplace and confirm local gear photos load from `https://<api>/static/gear/...`.
- Verify the Vercel browser console has no CORS errors.
- Place a test cash-on-delivery order and check stock updates.
- Check a mobile-width view: navigation, notifications, top picks, suggestions, cart, and checkout.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Browser shows a CORS error | Add the exact Vercel origin to Render's `CORS_ORIGINS`; no trailing slash. |
| Gear photos fail on Vercel | Confirm `backend/gear` was committed, the Render static URL opens directly, and `NEXT_PUBLIC_API_BASE_URL` was set before the build. Redeploy Vercel after changing it. |
| API fails at boot | Check `DATABASE_URL`, Alembic logs, and that `JWT_SECRET_KEY` is not blank. |
| No AI advisory | Set a valid `GROQ_API_KEY` or `GEMINI_API_KEY`; the rest of the app can still operate without one. |
| Render service sleeps | Free service behaviour and quotas can change. Use a paid plan if you need predictable always-on availability. |
