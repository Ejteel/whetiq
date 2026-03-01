// Drizzle-ready table metadata for MVP schema. Replace with real drizzle sqliteTable calls when deps are installed.
export const schema = {
  projects: ["id", "name", "created_at", "updated_at"],
  threads: ["id", "project_id", "name", "default_provider", "default_model", "created_at", "updated_at"],
  messages: ["id", "thread_id", "role", "content_json", "metadata_json", "created_at"],
  enhancer_packs: ["id", "project_id", "name", "version", "rules_json", "created_at", "updated_at"],
  provider_accounts: ["id", "provider", "keychain_ref", "config_json", "created_at", "updated_at"],
  attachments: [
    "id",
    "project_id",
    "thread_id",
    "message_id",
    "file_name",
    "mime_type",
    "size_bytes",
    "local_path",
    "extracted_text",
    "extraction_status",
    "created_at"
  ],
  runs: [
    "id",
    "thread_id",
    "user_message_id",
    "provider",
    "model",
    "transformed_prompt_snapshot",
    "raw_response_json",
    "status",
    "latency_ms",
    "token_in",
    "token_out",
    "cost_estimate",
    "created_at"
  ]
} as const;

export const indexes = {
  messages_thread_created_at: ["thread_id", "created_at"],
  threads_project_updated_at: ["project_id", "updated_at"],
  attachments_thread_created_at: ["thread_id", "created_at"],
  runs_thread_created_at: ["thread_id", "created_at"]
} as const;
