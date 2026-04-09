import assert from "node:assert/strict";
import test from "node:test";
import { serializeSpecToPromptString } from "../packages/core/dist/index.js";

test("serializeSpecToPromptString renders the canonical prompt sections", () => {
  const prompt = serializeSpecToPromptString({
    role: "Career strategist",
    objective: "Tailor the summary",
    context: ["Candidate is open to fintech roles", "Prefer concise bullets"],
    constraints: ["No buzzwords", "Keep it factual"],
    outputFormat: "Markdown bullet list",
    qualityBar: ["Use strong verbs", "Be specific"],
    missingInfoQuestions: [],
    userDraft: "Rewrite this experience section"
  });

  assert.match(prompt, /ROLE: Career strategist/);
  assert.match(prompt, /OBJECTIVE: Tailor the summary/);
  assert.match(prompt, /CONTEXT:\n- Candidate is open to fintech roles\n- Prefer concise bullets/);
  assert.match(prompt, /CONSTRAINTS:\n- No buzzwords\n- Keep it factual/);
  assert.match(prompt, /QUALITY_BAR:\n- Use strong verbs\n- Be specific/);
  assert.match(prompt, /USER_INPUT: Rewrite this experience section/);
});
