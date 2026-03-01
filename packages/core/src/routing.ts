import type { Provider, RoutingRecommendation } from "./types.js";

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
      confidence: 0.72
    };
  }

  const pick = (() => {
    if (input.messageIntent === "long_document" && input.availableProviders.includes("anthropic")) {
      return { provider: "anthropic" as const, reason: "Long context optimization", confidence: 0.8 };
    }
    if (input.messageIntent === "code" && input.availableProviders.includes("openai")) {
      return { provider: "openai" as const, reason: "Code/debug reliability", confidence: 0.77 };
    }
    if (input.messageIntent === "creative" && input.availableProviders.includes("gemini")) {
      return { provider: "gemini" as const, reason: "Style variation for creative tasks", confidence: 0.66 };
    }
    const fallback = input.availableProviders[0] ?? "openai";
    return { provider: fallback, reason: "Default availability", confidence: 0.5 };
  })();

  return pick;
}
