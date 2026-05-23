#!/usr/bin/env bash
# Render build: frontend (Vite) + backend (Express)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Building frontend..."
cd "$ROOT/frontend"
npm ci --include=dev
npm run build

echo "==> Installing backend..."
cd "$ROOT/backend"
npm ci --omit=dev

echo "==> Build complete."
