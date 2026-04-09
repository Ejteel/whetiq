import type { Provider, RoutingRecommendation } from "./types.js";

/** Empirical default for preserving thread continuity; not statistically validated. */
const THREAD_CONSISTENCY_CONFIDENCE = 0.72;

/** Empirical default for Anthropic on long-context prompts; not statistically validated. */
const LONG_CONTEXT_CONFIDENCE = 0.8;

/** Empirical default for OpenAI on code/debug prompts; not statistically validated. */
const CODE_RELIABILITY_CONFIDENCE = 0.77;

/** Empirical default for Gemini on creative prompts; not statistically validated. */
const CREATIVE_VARIATION_CONFIDENCE = 0.66;

/** Empirical fallback confidence when only availability is known; not statistically validated. */
const DEFAULT_AVAILABILITY_CONFIDENCE = 0.5;

export interface RoutingInput {
  messageIntent: "code" | "long_document" | "creative" | "general";
  availableProviders: Provider[];
  threadPreferredProvider?: Provider;
}

export function recommendProvider(input: RoutingInput): RoutingRecommendation {
  if (input.threadPreferredProvider && input.availableProviders.includes(input.threadPreferredProvider)) {
    return {
      provider: input.threadPreferredProvider,
      reason: "Thread consistency",
      confidence: THREAD_CONSISTENCY_CONFIDENCE
    };
  }

  const pick = (() => {
    if (input.messageIntent === "long_document" && input.availableProviders.includes("anthropic")) {
      return {
        provider: "anthropic" as const,
        reason: "Long context optimization",
        confidence: LONG_CONTEXT_CONFIDENCE
      };
    }
    if (input.messageIntent === "code" && input.availableProviders.includes("openai")) {
      return {
        provider: "openai" as const,
        reason: "Code/debug reliability",
        confidence: CODE_RELIABILITY_CONFIDENCE
      };
    }
    if (input.messageIntent === "creative" && input.availableProviders.includes("gemini")) {
      return {
        provider: "gemini" as const,
        reason: "Style variation for creative tasks",
        confidence: CREATIVE_VARIATION_CONFIDENCE
      };
    }
    const fallback = input.availableProviders[0] ?? "openai";
    return {
      provider: fallback,
      reason: "Default availability",
      confidence: DEFAULT_AVAILABILITY_CONFIDENCE
    };
  })();

  return pick;
}
