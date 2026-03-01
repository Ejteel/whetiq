import type { Provider } from "@mvp/core";
import type { ProviderAdapter } from "./types.js";
import { anthropicAdapter } from "./providers/anthropic.js";
import { geminiAdapter } from "./providers/gemini.js";
import { openAIAdapter } from "./providers/openai.js";

export * from "./types.js";

const adapters: Record<Provider, ProviderAdapter> = {
  openai: openAIAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter
};

export function getAdapter(provider: Provider): ProviderAdapter {
  return adapters[provider];
}
