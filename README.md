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
- API: http://localhost:5000/api/health  
- Demo login (after seed): `demo@aiinvoice.com` / `demo123456`

## Production

See [PRODUCTION.md](./PRODUCTION.md) for Docker, env vars, and deployment checklist.

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
