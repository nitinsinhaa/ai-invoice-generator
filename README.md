# AI Invoice Generator

AI-assisted invoicing, inventory, expenses, and finance dashboard for small businesses.

## Stack

- **Backend:** Node.js, Express, PostgreSQL, Gemini AI, JWT + refresh tokens
- **Frontend:** React, Vite, Tailwind CSS

## Quick start (local)

```bash
# Database
cd backend && cp .env.example .env   # edit DB + JWT_SECRET + GEMINI_API_KEY
npm install && npm run migrate && npm run seed && npm run dev

# Frontend (new terminal)
cd frontend && cp .env.example .env
npm install && npm run dev
```

- App: http://localhost:3000  
- API health: http://localhost:5000/api/health (legacy) or http://localhost:5000/api/v1/health  
- REST API base path: **`/api/v1`** (e.g. `/api/v1/auth/login`, `/api/v1/invoices`)  
- Demo login (after seed): `demo@aiinvoice.com` / `demo123456`

### Rate limiting (production)

When `NODE_ENV=production`:

| Endpoint group | Limit |
|----------------|-------|
| General API | 100 requests / 15 min per IP |
| AI routes (`/api/v1/ai/*`) | 20 requests / minute per user |
| Invoice email send | 10 emails / hour per user |

Limits are relaxed in development (`NODE_ENV=development`).

## Production & deploy

- **[DEPLOY.md](./DEPLOY.md)** — deploy to Render (recommended), Docker, or VPS
- **[PRODUCTION.md](./PRODUCTION.md)** — env vars, security checklist

Quick Render: [New Blueprint](https://dashboard.render.com/blueprints) → connect `nitinsinhaa/ai-invoice-generator` → open **ai-invoice-api** URL (serves app + API).

## Push to GitHub

```bash
gh auth login
./scripts/push-to-github.sh
# optional: ./scripts/push-to-github.sh my-repo-name private
```

## Docs

- [APP_VISION.md](./APP_VISION.md) — product model
- [EMAIL_SETUP.md](./EMAIL_SETUP.md) — SMTP notifications
- [backend/README.md](./backend/README.md) — API details

## License

MIT
