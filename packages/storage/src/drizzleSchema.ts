import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projectsTable = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const threadsTable = sqliteTable("threads", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  name: text("name").notNull(),
  defaultProvider: text("default_provider").notNull(),
  defaultModel: text("default_model").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const messagesTable = sqliteTable("messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  role: text("role").notNull(),
  contentJson: text("content_json").notNull(),
  metadataJson: text("metadata_json").notNull(),
  createdAt: text("created_at").notNull()
});

export const enhancerPacksTable = sqliteTable("enhancer_packs", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  name: text("name").notNull(),
  version: integer("version").notNull(),
  rulesJson: text("rules_json").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const providerAccountsTable = sqliteTable("provider_accounts", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  keychainRef: text("keychain_ref").notNull(),
  configJson: text("config_json").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const attachmentsTable = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  threadId: text("thread_id").notNull(),
  messageId: text("message_id"),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  localPath: text("local_path").notNull(),
  extractedText: text("extracted_text"),
  extractionStatus: text("extraction_status").notNull(),
  createdAt: text("created_at").notNull()
});

export const runsTable = sqliteTable("runs", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  userMessageId: text("user_message_id").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  transformedPromptSnapshot: text("transformed_prompt_snapshot").notNull(),
  rawResponseJson: text("raw_response_json"),
  status: text("status").notNull(),
  latencyMs: integer("latency_ms"),
  tokenIn: integer("token_in"),
  tokenOut: integer("token_out"),
  costEstimate: real("cost_estimate"),
  createdAt: text("created_at").notNull()
});
