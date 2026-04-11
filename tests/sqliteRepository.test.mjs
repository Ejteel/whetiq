import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import Database from "better-sqlite3";
import { SQLiteRepository } from "../packages/storage/dist/index.js";

test("SQLiteRepository.updateRun preserves untouched fields on partial updates", async () => {
  const dbDirectory = mkdtempSync(join(tmpdir(), "whetiq-sqlite-"));
  const dbPath = join(dbDirectory, "repository.db");
  const repository = new SQLiteRepository(dbPath);
  const project = await repository.createProject({ name: "Test Project" });
  const thread = await repository.createThread({
    projectId: project.id,
    name: "Thread",
    defaultProvider: "openai",
    defaultModel: "gpt-4.1"
  });
  await repository.createMessage({
    id: "message-1",
    projectId: project.id,
    threadId: thread.id,
    role: "user",
    contentBlocks: [{ type: "text", text: "hello" }],
    metadata: {},
    createdAt: "2026-04-09T00:00:00.000Z"
  });

  await repository.createRun({
    id: "run-1",
    threadId: thread.id,
    userMessageId: "message-1",
    provider: "openai",
    model: "gpt-4.1",
    transformedPromptSnapshot: "prompt snapshot",
    rawResponseJson: { text: "initial" },
    status: "running",
    latencyMs: 42,
    tokenIn: 100,
    tokenOut: 50,
    costEstimate: 0.123456,
    createdAt: "2026-04-09T00:00:00.000Z"
  });

  await repository.updateRun("run-1", { status: "complete" });

  const sqlite = new Database(dbPath, { readonly: true });
  const row = sqlite.prepare("SELECT * FROM runs WHERE id = ?").get("run-1");

  assert.equal(row.status, "complete");
  assert.equal(row.thread_id, thread.id);
  assert.equal(row.user_message_id, "message-1");
  assert.equal(row.provider, "openai");
  assert.equal(row.model, "gpt-4.1");
  assert.equal(row.transformed_prompt_snapshot, "prompt snapshot");
  assert.equal(row.raw_response_json, JSON.stringify({ text: "initial" }));
  assert.equal(row.latency_ms, 42);
  assert.equal(row.token_in, 100);
  assert.equal(row.token_out, 50);
  assert.equal(row.cost_estimate, 0.123456);
  assert.equal(row.created_at, "2026-04-09T00:00:00.000Z");

  sqlite.close();
});
