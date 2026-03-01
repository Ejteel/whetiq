import type {
  CanonicalProviderError,
  CanonicalPromptSpec,
  CanonicalStreamEvent,
  ContextWindow,
  ModelConfig,
  ProviderRequest,
  TokenEstimate
} from "@mvp/core";

export interface ProviderAdapter {
  buildRequest(spec: CanonicalPromptSpec, contextWindow: ContextWindow, model: ModelConfig): ProviderRequest;
  streamResponse(request: ProviderRequest, apiKey: string): AsyncIterable<CanonicalStreamEvent>;
  normalizeError(error: unknown): CanonicalProviderError;
  estimateTokens(request: ProviderRequest): TokenEstimate;
}
