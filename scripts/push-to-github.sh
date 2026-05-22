#!/usr/bin/env bash
# Create a new GitHub repo and push this project.
# Prerequisites: gh auth login (run once)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="$HOME/.local/bin:$PATH"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) not found. Install: https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Log in to GitHub first:"
  echo "  gh auth login"
  exit 1
fi

REPO_NAME="${1:-ai-invoice-generator}"
VISIBILITY="${2:-public}"

echo "Creating GitHub repo: $REPO_NAME ($VISIBILITY)"
gh repo create "$REPO_NAME" \
  --"$VISIBILITY" \
  --source=. \
  --remote=origin \
  --description "AI-assisted invoice, inventory, and finance management app" \
  --push

echo ""
echo "Done. View at: $(gh repo view --web 2>/dev/null || gh repo view --json url -q .url)"
