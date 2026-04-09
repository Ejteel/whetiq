import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCanonicalPromptSpec,
  enforceTokenBudget
} from "../packages/core/dist/index.js";
import { InMemoryRepository } from "../packages/storage/dist/index.js";

test("buildCanonicalPromptSpec uses template and pack data when provided", () => {
  const spec = buildCanonicalPromptSpec({
    pack: {
      id: "pack-1",
      projectId: "project-1",
      name: "Career Pack",
      version: 1,
      houseRules: ["Use measurable outcomes"],
      templates: [
        {
          id: "resume",
          name: "Resume Tailoring",
          purpose: "Tailor the resume summary",
          requiredInputs: [],
          outputFormat: "Bulleted markdown",
          constraints: ["Keep it under 120 words"],
          qualityChecks: ["Use strong verbs"],
          missingInfoQuestions: ["Which role is this for?"]
        }
      ],
      providerOverrides: {}
    },
    templateId: "resume",
    projectInstructions: ["Match the employer context"],
    contextWindow: {
      summary: "Candidate has led platform migrations",
      messages: [
        {
          id: "message-1",
          projectId: "project-1",
          threadId: "thread-1",
          role: "user",
          contentBlocks: [{ type: "text", text: "Focus on architecture." }],
          metadata: {},
          createdAt: "2026-04-09T00:00:00.000Z"
        }
      ],
      maxMessages: 5
    },
    userDraft: "Rewrite my summary"
  });

  assert.equal(spec.role, "Expert assistant for project context");
  assert.equal(spec.objective, "Tailor the resume summary");
  assert.deepEqual(spec.constraints, ["Use measurable outcomes", "Keep it under 120 words"]);
  assert.equal(spec.outputFormat, "Bulleted markdown");
  assert.deepEqual(spec.qualityBar, ["Use strong verbs"]);
  assert.deepEqual(spec.missingInfoQuestions, ["Which role is this for?"]);
  assert.deepEqual(spec.context, [
    "Match the employer context",
    "Thread summary: Candidate has led platform migrations",
    "[user] Focus on architecture."
  ]);
});

test("buildCanonicalPromptSpec falls back to defaults without a pack", () => {
  const spec = buildCanonicalPromptSpec({
    projectInstructions: [],
    contextWindow: { messages: [], maxMessages: 3 },
    userDraft: "Help me tighten this answer"
  });

  assert.equal(spec.objective, "Address the user request accurately");
  assert.equal(spec.outputFormat, "Clear markdown with concise sections");
  assert.deepEqual(spec.qualityBar, ["Deliver a direct, high-signal response."]);
  assert.deepEqual(spec.missingInfoQuestions, ["What outcome format do you prefer?", "Any constraints to respect?"]);
  assert.deepEqual(spec.constraints, []);
  assert.deepEqual(spec.context, []);
});

test("enforceTokenBudget keeps prompts under the limit unchanged", () => {
  const prompt = "Short prompt";
  const result = enforceTokenBudget(prompt, {
    provider: "openai",
    model: "gpt-4.1",
    maxInputTokens: 100,
    maxOutputTokens: 50
  });

  assert.equal(result.prompt, prompt);
  assert.equal(result.truncated, false);
});

test("enforceTokenBudget truncates prompts over the limit", () => {
  const result = enforceTokenBudget("A".repeat(60), {
    provider: "openai",
    model: "gpt-4.1",
    maxInputTokens: 5,
    maxOutputTokens: 50
  });

  assert.equal(result.truncated, true);
  assert.match(result.prompt, /\[TRUNCATED_FOR_TOKEN_BUDGET\]$/);
});

test("InMemoryRepository createMessage and listMessages filter by threadId", async () => {
  const repository = new InMemoryRepository();
  await repository.createMessage({
    id: "message-1",
    projectId: "project-1",
    threadId: "thread-1",
    role: "user",
    contentBlocks: [{ type: "text", text: "First thread" }],
    metadata: {},
    createdAt: "2026-04-09T00:00:00.000Z"
  });
  await repository.createMessage({
    id: "message-2",
    projectId: "project-1",
    threadId: "thread-2",
    role: "assistant",
    contentBlocks: [{ type: "text", text: "Second thread" }],
    metadata: {},
    createdAt: "2026-04-09T00:00:01.000Z"
  });

  const threadMessages = await repository.listMessages("thread-1");

  assert.equal(threadMessages.length, 1);
  assert.equal(threadMessages[0].id, "message-1");
});
