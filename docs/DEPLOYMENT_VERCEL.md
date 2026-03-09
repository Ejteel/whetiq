# Vercel Deployment Guide

This guide deploys `apps/web` securely with support for:
- private access (OAuth)
- private production access (OAuth)
- public demo mode (no provider keys, no AI calls)

## 1) Create Vercel Project
1. Import this GitHub repository into Vercel.
2. Set **Root Directory** to `apps/web`.
3. Framework preset should resolve to **Next.js**.
4. Keep install/build defaults (`npm install`, `next build`).

## 2) Configure OAuth Provider(s) (for private access)
Configure one or both:

### GitHub OAuth App
1. GitHub -> Settings -> Developer settings -> OAuth Apps -> New OAuth App.
2. Add callback URL:
   - Private: `https://<your-private-domain>/api/auth/callback/github`
   - Production: `https://<your-prod-domain>/api/auth/callback/github`

### Google OAuth Client
1. Google Cloud Console -> APIs & Services -> Credentials -> Create OAuth Client ID.
2. Authorized redirect URIs:
   - Private: `https://<your-private-domain>/api/auth/callback/google`
   - Production: `https://<your-prod-domain>/api/auth/callback/google`

Add these Vercel env vars (Preview and/or Production):
- `PRIVATE_AUTH_MODE=oauth` (or `hybrid` for Basic + OAuth)
- `AUTH_SECRET=<long random secret>`
- `NEXTAUTH_URL=https://<environment-domain>`
- `AUTH_GITHUB_ID=<github oauth client id>`
- `AUTH_GITHUB_SECRET=<github oauth client secret>`
- `AUTH_GOOGLE_ID=<google oauth client id>`
- `AUTH_GOOGLE_SECRET=<google oauth client secret>`

Notes:
- `AUTH_SECRET` or `NEXTAUTH_SECRET` is required.
- Configure at least one provider pair (GitHub or Google).
- Provider-side 2FA is enforced if the user account has 2FA enabled.
- Optional but recommended for private pilots:
  - `ALLOWED_EMAILS` (comma-separated exact emails)
  - `ALLOWED_DOMAINS` (comma-separated domains)
  - If both are empty, any authenticated OAuth user is allowed.

## 3) Choose Deployment Mode

### A) Private Access (recommended)
Use in Vercel **Preview**:
- `PRIVATE_AUTH_MODE=oauth` (or `hybrid`)
- OAuth vars from section 2
- Optional provider keys

### B) Private Production
Use in Vercel **Production**:
- `PRIVATE_AUTH_MODE=oauth` (or `hybrid`)
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
- Optional: leave `PRIVATE_AUTH_MODE` unset so middleware resolves to public demo mode

In this mode, `/api/chat` returns mock/demo output and never calls external providers.

## 4) Verify
After deploy:
1. Open site home page.
2. Click **Open Demo Workspace** and verify `/workspace` loads without OAuth.
3. Click **Sign In for Private Workspace** and verify redirect to `/login`.
4. Sign in with GitHub or Google and confirm redirect to `/private-workspace`.
5. Send chat input and confirm:
   - Demo mode: receives "Demo Mode Response"
   - Real mode: receives provider response
6. Confirm login page behavior:
   - Configured providers render as buttons.
   - Missing providers show setup guidance (no black-screen server error).

For repeatable browser QA and pilot UX findings format, use:
- `npm run test:e2e`
- [docs/PILOT_UX_QA_PROTOCOL.md](./PILOT_UX_QA_PROTOCOL.md)

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

