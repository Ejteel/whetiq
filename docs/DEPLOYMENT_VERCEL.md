# WhetIQ Vercel Deployment Guide

Version `v2.0`  
Supersedes previous `DEPLOYMENT_VERCEL.md`

Covers:
- `apps/web`
- `apps/narrative`
- `apps/landing`

## Overview

WhetIQ deploys three Next.js apps from one monorepo, [`github.com/Ejteel/whetiq`](https://github.com/Ejteel/whetiq), into three separate Vercel projects. All three appear under `whetiq.com`, with domain routing handled by the landing app.

| Vercel Project | Root Directory | Public URL |
| --- | --- | --- |
| `whetiq-landing` | `apps/landing` | `whetiq.com` |
| `whetiq-narrative` | `apps/narrative` | `whetiq.com/narrative` |
| `whetiq-web` | `apps/web` | `whetiq.com/workspace` |

## 1. Prerequisites

- GitHub repository renamed to `whetiq` (`github.com/Ejteel/whetiq`)
- Neon account exists at [neon.com](https://neon.com) with a project created
- GitHub OAuth App configured and reused from the existing deployment
- Google OAuth Client configured and reused from the existing deployment
- All 13 Remediation Directive items complete

## 2. Create Vercel Projects

`whetiq-web` already exists. Create new Vercel projects for landing and narrative.

For each new project:
- Vercel Dashboard -> Add New -> Project -> Import Git Repository -> select `Ejteel/whetiq`
- Set Root Directory to `apps/landing` or `apps/narrative`
- Override Install Command to `cd ../.. && npm install`
- Override Build Command to `npx drizzle-kit migrate && next build`
- Deploy and record the generated `.vercel.app` URL

For the existing `whetiq-web` project:
- Vercel Dashboard -> `whetiq-web` -> Settings -> Build & Deployment
- Verify Install Command is `cd ../.. && npm install`
- Build Command remains `next build`

## 3. Neon Integration

Install once and connect it to both `whetiq-narrative` and `whetiq-landing`:

- Neon Console -> Integrations -> Add -> Vercel
- Select "Link Existing Neon Account"
- Connect the integration to both Vercel projects
- Enable "Create a branch for your development environment"
- Enable "Automatically delete obsolete Neon branches"
- Click Connect

After installation, `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are injected automatically into both projects for Development, Preview, and Production. Do not set them manually.

Do not install the Neon integration on `whetiq-web`.

## 4. Environment Variables

### 4.1 `whetiq-narrative`

Set these manually in Vercel for Production and Preview:

| Variable | Value / Source |
| --- | --- |
| `DATABASE_URL` | Auto-set by Neon integration; do not add manually |
| `DATABASE_URL_UNPOOLED` | Auto-set by Neon integration; do not add manually |
| `AUTH_SECRET` | Same long random secret used in `apps/web` |
| `NEXTAUTH_URL` | `https://whetiq.com/narrative` in Production, preview URL in Preview |
| `AUTH_GITHUB_ID` | Same GitHub OAuth App as `apps/web` |
| `AUTH_GITHUB_SECRET` | Same GitHub OAuth App as `apps/web` |
| `AUTH_GOOGLE_ID` | Same Google OAuth Client as `apps/web` |
| `AUTH_GOOGLE_SECRET` | Same Google OAuth Client as `apps/web` |
| `WHETIQ_OWNER_EMAIL` | Your OAuth sign-in email |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

### 4.2 `whetiq-landing`

Set these manually in Vercel for Production and Preview:

| Variable | Value / Source |
| --- | --- |
| `DATABASE_URL` | Auto-set by Neon integration; do not add manually |
| `DATABASE_URL_UNPOOLED` | Auto-set by Neon integration; do not add manually |
| `AUTH_SECRET` | Same long random secret used in `apps/web` |
| `NEXTAUTH_URL` | `https://whetiq.com` in Production, preview URL in Preview |
| `AUTH_GITHUB_ID` | Same GitHub OAuth App as `apps/web` |
| `AUTH_GITHUB_SECRET` | Same GitHub OAuth App as `apps/web` |
| `AUTH_GOOGLE_ID` | Same Google OAuth Client as `apps/web` |
| `AUTH_GOOGLE_SECRET` | Same Google OAuth Client as `apps/web` |
| `WHETIQ_OWNER_EMAIL` | Same owner email used for narrative |
| `NARRATIVE_URL` | Auto-generated Vercel URL for `whetiq-narrative` |
| `WORKSPACE_URL` | Auto-generated Vercel URL for `whetiq-web` |

### 4.3 `whetiq-web`

Existing environment variables remain unchanged. Verify these are still configured:

- `PRIVATE_AUTH_MODE`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`

## 5. OAuth Callback URLs

Update the existing GitHub OAuth App and Google OAuth Client. Do not create new OAuth apps.

GitHub OAuth App callback URLs:
- `https://whetiq.com/api/auth/callback/github`
- `https://whetiq.com/narrative/api/auth/callback/github`
- `https://<whetiq-narrative-project>.vercel.app/api/auth/callback/github`

Google OAuth Client redirect URIs:
- `https://whetiq.com/api/auth/callback/google`
- `https://whetiq.com/narrative/api/auth/callback/google`
- `https://<whetiq-narrative-project>.vercel.app/api/auth/callback/google`

## 6. Domain Routing

- Vercel Dashboard -> `whetiq-landing` -> Settings -> Domains
- Add `whetiq.com` and `www.whetiq.com`
- Update DNS with the registrar per Vercel instructions
- Update [`apps/landing/vercel.json`](/Users/ejteel/Documents/New%20project/apps/landing/vercel.json) with the real Vercel project URLs after first deploy
- Redeploy `whetiq-landing` after those URLs are updated

## 7. GitHub Actions Secrets

Add these repository secrets in GitHub -> Settings -> Secrets and variables -> Actions:

| Secret Name | Value |
| --- | --- |
| `DATABASE_URL_CI` | Neon dev branch pooled connection string |
| `DATABASE_URL_UNPOOLED_CI` | Neon dev branch direct connection string |

## 8. Verify After First Deployment

- `whetiq.com` loads the Landing Hub with your name and project cards
- `whetiq.com/narrative` loads the published career narrative profile
- `whetiq.com/workspace` loads the prompt enhancer
- OAuth sign-in activates edit mode on landing and narrative
- Publishing a change updates the visitor view without a reload
- Signing out removes all edit chrome
- Feature-branch pushes create preview deployments and Neon preview branches
- Merging the branch removes the preview Neon branch

## 9. Operational Safety

- Never commit `.env.local` or any file containing real credentials
- Never set `DATABASE_URL` manually on Neon-integrated Vercel projects
- Never run `drizzle-kit migrate` locally against the production Neon branch
- Rotate OAuth and API secrets immediately if exposed
- Preview environments are indexed off via middleware `X-Robots-Tag`

## 10. Local Development Commands

```bash
# Install all dependencies
npm install

# Run prompt enhancer (existing)
npm run -w @mvp/web dev

# Run narrative app
npm run -w @whetiq/narrative dev

# Run landing hub
npm run -w @whetiq/landing dev

# Run all (web + narrative + landing)
concurrently "npm run -w @mvp/web dev" "npm run -w @whetiq/narrative dev" "npm run -w @whetiq/landing dev"

# Type check all
npm run typecheck

# Lint all
npm run lint

# Test all
npm test

# Run Drizzle migrations locally (narrative)
npm run -w @whetiq/narrative migrate

# Run Drizzle migrations locally (landing)
npm run -w @whetiq/landing migrate
```
