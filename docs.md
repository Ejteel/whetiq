# MVP Implementation Notes

## What is fully wired
- Canonical types and enhancer schema
- Provider adapter contract and provider-specific transform implementations with live SSE API streaming
- Chat orchestration flow for send -> stream -> persist run + messages + transformed snapshots
- Local-first storage contracts and Drizzle SQLite repository + migration SQL
- Provider account service with keychain abstraction (OS keychain client + in-memory fallback)
- Attachment text extraction abstraction

## What remains to productionize
- Replace placeholder attachment extraction for binary formats with robust parsers (PDF/DOCX)
- Implement provider account management UI and persisted project/thread CRUD in frontend
- Add integration/e2e tests for real provider streaming in desktop runtime
