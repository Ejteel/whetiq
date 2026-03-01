# Aggreate AI Prompt Enhancer

[![CI](https://github.com/Ejteel/aggreate-ai-prompt-enhancer/actions/workflows/ci.yml/badge.svg)](https://github.com/Ejteel/aggreate-ai-prompt-enhancer/actions/workflows/ci.yml)

Local-first desktop + web workspace for multi-provider AI conversations with prompt enhancement, canonical thread state, and provider/model switching.

## Quick Start (5 minutes)
```bash
git clone https://github.com/Ejteel/aggreate-ai-prompt-enhancer.git
cd aggreate-ai-prompt-enhancer
npm run setup
cp .env.example .env.local
npm run -w @mvp/web dev
```
Open `http://localhost:3001`.

## PRD
- In-repo PRD (Markdown): [docs/PRODUCT_REQUIREMENTS_DOCUMENT.md](docs/PRODUCT_REQUIREMENTS_DOCUMENT.md)
- PRD (Word): [docs/PRODUCT_REQUIREMENTS_DOCUMENT.docx](docs/PRODUCT_REQUIREMENTS_DOCUMENT.docx)

## Expected UI Baseline
- Conversation layout: ![Conversation baseline](docs/screenshots/conversation-baseline.svg)
- Markdown rendering state: ![Markdown rendering baseline](docs/screenshots/markdown-baseline.svg)

## Current Capabilities
- Unified chat UI for OpenAI, Anthropic, and Gemini.
- Prompt enhancement toggle per message.
- Transformed prompt preview for transparency.
- Assistant markdown rendering (`react-markdown` + `remark-gfm`).
- Local-first architecture with shared core, adapters, API orchestration, and storage packages.

## Architecture (Where To Edit What)
```mermaid
flowchart LR
  W["apps/web"] --> API["packages/api"]
  D["apps/desktop"] --> API
  API --> C["packages/core"]
  API --> A["packages/adapters"]
  API --> S["packages/storage"]

  C --> T["Canonical types, enhancer, routing"]
  A --> P["Provider API + SSE normalization"]
  S --> DB["In-memory + SQLite/Drizzle"]
```

## Monorepo Layout
- `apps/web`: Next.js chat app UI and API route fallback.
- `apps/desktop`: Electron shell + preload bridge.
- `packages/core`: Canonical types, enhancer, routing.
- `packages/adapters`: Provider integrations and SSE parsing.
- `packages/api`: Chat orchestration services/contracts.
- `packages/storage`: In-memory + SQLite/Drizzle repositories.
- `docs`: Product documentation (including PRD).

## Requirements
- Node.js 20+
- npm 10+

## Setup
```bash
npm run setup
```

Set API keys before calling providers:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`

## Run
Web app:
```bash
npm run -w @mvp/web dev
```

Desktop app loop:
```bash
npm run dev
```

## Build and Test
```bash
npm run build
npm run typecheck
npm test
```

## Troubleshooting
- `Safari can’t connect to localhost:3001`
  - Ensure dev server is running: `npm run -w @mvp/web dev`
- CSS looks unstyled/default HTML
  - Hard refresh (`Cmd+Option+R`) and disable content blockers for localhost.
  - If needed: `rm -rf apps/web/.next && npm run -w @mvp/web dev`
- Port conflict on 3001
  - Find process: `lsof -nP -iTCP:3001 -sTCP:LISTEN`
  - Stop conflicting process or change web port in `apps/web/package.json`.
- Provider calls fail
  - Verify keys with: `npm run doctor`

## Execution Workflow
Use GitHub issue templates to execute PRD scope:
- `Feature Request` for new product capabilities.
- `Roadmap Task` for implementation units tied to PRD sections/milestones.
- `Bug Report` for regressions and quality issues.

## Notes
- Never commit API keys or secrets.
- If a key is exposed, rotate it immediately.
