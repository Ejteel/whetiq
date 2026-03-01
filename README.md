# Canonical Conversation MVP

Local-first desktop web app scaffold for multi-provider chat (OpenAI, Anthropic, Gemini) using:
- One canonical message model
- Enhancer pipeline
- Provider adapters
- SQLite/Drizzle schema

## Current state
This repo contains architecture-complete scaffolding for MVP phases:
- Shared canonical types and interfaces
- Enhancer compiler + provider transforms
- Adapter contracts and mock stream implementations
- Local API orchestration and persistence contracts
- Desktop/web shell bootstrap files
- Test coverage for deterministic prompt compilation, routing, and normalization

## Run
Install dependencies, then:

```bash
npm install
npm run build
npm run typecheck
npm test
```

## Development
For the full desktop loop:

```bash
npm run dev
```

Set API keys before launch as needed:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`

## Notes
- Provider streaming is wired against official HTTP APIs using SSE parsing in adapters.
- Electron uses local SQLite (Drizzle + better-sqlite3) and keychain-backed provider key storage abstraction.
