import { getAdapter } from "@mvp/adapters";
import {
  DEFAULT_MAX_CONTEXT_MESSAGES,
  DEFAULT_MAX_INPUT_TOKENS,
  DEFAULT_MAX_OUTPUT_TOKENS,
  serializeSpecToPromptString,
  type NarrativeProfile,
  type TailoringContext,
} from "@mvp/core";
import { buildCanonicalPromptSpec, type CanonicalPromptSpec } from "@mvp/core";

function buildTailoringSpec(
  profile: NarrativeProfile,
  context: TailoringContext,
): CanonicalPromptSpec {
  return buildCanonicalPromptSpec({
    projectInstructions: [
      `Profile: ${profile.name}`,
      `Location: ${profile.location}`,
      `Availability: ${profile.availability}`,
      `Company: ${context.company ?? "Unknown"}`,
      `Role: ${context.role ?? "Unknown"}`,
    ],
    contextWindow: { messages: [], maxMessages: DEFAULT_MAX_CONTEXT_MESSAGES },
    userDraft: `Tailor the opening summary for ${context.company ?? "a hiring manager"} using this fallback summary: ${profile.summary.fallback}`,
  });
}

export async function generateTailoredNarrativeSummary(
  profile: NarrativeProfile,
  context: TailoringContext,
): Promise<string> {
  const adapter = getAdapter("anthropic");
  const spec = buildTailoringSpec(profile, context);
  const request = adapter.buildRequest(
    spec,
    { messages: [], maxMessages: DEFAULT_MAX_CONTEXT_MESSAGES },
    {
      provider: "anthropic",
      model: "claude-3-7-sonnet-latest",
      maxInputTokens: DEFAULT_MAX_INPUT_TOKENS,
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    },
  );

  return serializeSpecToPromptString({
    ...spec,
    userDraft: `${spec.userDraft}\n\nREQUEST_PAYLOAD:${JSON.stringify(request.payload)}`,
  });
}
