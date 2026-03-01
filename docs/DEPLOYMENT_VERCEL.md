# Vercel Deployment Guide

This guide deploys `apps/web` securely with support for:
- private preview access (OAuth)
- private production access (OAuth)
- public demo mode (no provider keys, no AI calls)

## 1) Create Vercel Project
1. Import this GitHub repository into Vercel.
2. Set **Root Directory** to `apps/web`.
3. Framework preset should resolve to **Next.js**.
4. Keep install/build defaults (`npm install`, `next build`).

## 2) Configure GitHub OAuth (for private access)
Create a GitHub OAuth App:
1. GitHub -> Settings -> Developer settings -> OAuth Apps -> New OAuth App.
2. Add callback URL:
   - Preview: `https://<your-preview-domain>/api/auth/callback/github`
   - Production: `https://<your-prod-domain>/api/auth/callback/github`

Add these Vercel env vars (Preview and/or Production):
- `PREVIEW_AUTH_MODE=oauth`
- `AUTH_SECRET=<long random secret>`
- `NEXTAUTH_URL=https://<environment-domain>`
- `AUTH_GITHUB_ID=<github oauth client id>`
- `AUTH_GITHUB_SECRET=<github oauth client secret>`

Notes:
- `AUTH_SECRET` or `NEXTAUTH_SECRET` is required.
- GitHub 2FA is enforced if the GitHub account has 2FA enabled.

## 3) Choose Deployment Mode

### A) Private Preview (recommended)
Use in Vercel **Preview**:
- `PREVIEW_AUTH_MODE=oauth`
- OAuth vars from section 2
- Optional provider keys

### B) Private Production
Use in Vercel **Production**:
- `PREVIEW_AUTH_MODE=oauth`
- OAuth vars from section 2
- Provider keys:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `GEMINI_API_KEY`

### C) Public Demo (safe)
Use in Vercel **Production**:
- `DEMO_MODE=true`
- `PUBLIC_DEMO=true`
- Do not set provider API keys
- Optional: leave `PREVIEW_AUTH_MODE` unset so middleware resolves to public demo mode

In this mode, `/api/chat` returns mock/demo output and never calls external providers.

## 4) Verify
After deploy:
1. Open site home page.
2. If OAuth mode enabled, verify redirect to `/login`.
3. Sign in with GitHub.
4. Send chat input and confirm:
   - Demo mode: receives "Demo Mode Response"
   - Real mode: receives provider response

## 5) Operational Safety
- Never commit secrets to git.
- Rotate OAuth and provider secrets if exposed.
- Keep preview indexed off (middleware sets `X-Robots-Tag` on Vercel preview).

## 6) Local Commands
```bash
npm run doctor
npm run -w @mvp/web build
npm run -w @mvp/web dev
```

