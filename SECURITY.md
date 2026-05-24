# Security

## Reporting vulnerabilities

If you discover a security issue, please open a private report via GitHub Security Advisories on this repository rather than a public issue.

## Secrets and API keys

- Never commit `.env`, `credentials.txt`, or real API keys.
- Use `backend/.env.example` with placeholders only.
- Set `GEMINI_API_KEY` locally and in your host’s environment (e.g. Render dashboard).

## If a Gemini API key was exposed

1. **Revoke immediately** at [Google AI Studio API keys](https://aistudio.google.com/apikey) — delete the compromised key and create a new one.
2. Update `GEMINI_API_KEY` in `backend/.env` (local) and in Render (or your deployment) env vars.
3. Do not reuse the old key anywhere.

Git history for this repo was rewritten to remove a previously committed key from setup scripts. Scanners may take time to clear after rotation and history rewrite.
