# Production deployment guide

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Gemini API key (optional, for AI features)
- SMTP credentials (optional, for email notifications)

## Environment variables

Copy `backend/.env.example` to `backend/.env` and set:

| Variable | Production value |
|----------|------------------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | At least 16 random characters |
| `JWT_EXPIRE` | `15m` (short-lived access tokens) |
| `JWT_REFRESH_EXPIRE` | `7d` |
| `FRONTEND_URL` | Your app URL, e.g. `https://app.example.com` |
| `DB_*` | Production PostgreSQL credentials |
| `GEMINI_API_KEY` | Google AI Studio key |
| `RATE_LIMIT_MAX_REQUESTS` | `500` (per 15 min per IP) |

Frontend: copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL` to your API base (e.g. `https://api.example.com/api`).

## Database setup

```bash
cd backend
npm install
npm run migrate
npm run seed   # optional demo data
```

After deploy, run `npm run migrate` on every release that includes schema changes.

## Run with Docker Compose

```bash
# Set GEMINI_API_KEY in shell or .env file at project root
export GEMINI_API_KEY=your_key

docker compose up --build -d
```

- API: http://localhost:5000/api/health
- App: http://localhost:3000

Change `JWT_SECRET` and database passwords in `docker-compose.yml` before any real deployment.

## Run without Docker

```bash
# Terminal 1 — API
cd backend && npm install && npm run migrate && NODE_ENV=production npm start

# Terminal 2 — frontend (build + serve)
cd frontend && npm install && npm run build && npx serve -s dist -l 3000
```

Put a reverse proxy (nginx, Caddy) in front for HTTPS and route `/api` to the backend.

## Auth model

- **Access token** — sent as `Authorization: Bearer …`, expires in 15 minutes (default).
- **Refresh token** — stored in session storage; used to obtain new access tokens via `POST /api/auth/refresh`.
- Users must sign in again after refresh token expiry or explicit logout.

## Health and shutdown

- `GET /api/health` — returns `200` when DB is reachable, `503` if DB is down.
- API handles `SIGTERM` / `SIGINT` for graceful shutdown (closes HTTP server and DB pool).

## Security checklist

- [ ] Strong `JWT_SECRET` (32+ chars)
- [ ] `NODE_ENV=production` (enables rate limits)
- [ ] CORS `FRONTEND_URL` matches your real frontend origin
- [ ] PostgreSQL not exposed publicly
- [ ] HTTPS on reverse proxy
- [ ] Do not commit `.env` files

## CI

GitHub Actions workflow at `.github/workflows/ci.yml` runs backend tests (with Postgres) and frontend build on push/PR.
