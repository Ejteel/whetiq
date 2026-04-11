import {
  DEFAULT_MAX_OUTPUT_TOKENS,
  estimateCharacterTokens,
  type CanonicalProviderError,
  type CanonicalPromptSpec,
  type CanonicalStreamEvent,
  type ContextWindow,
  type ModelConfig,
  type ProviderRequest,
  type TokenEstimate
} from "@mvp/core";
import { iterateSSE, safeParseJson } from "../sse.js";
import type { ProviderAdapter } from "../types.js";

function buildInstruction(spec: CanonicalPromptSpec): string {
  const rules = spec.constraints.map((constraint) => `- ${constraint}`).join("\n");
  const success = spec.qualityBar.map((item) => `- ${item}`).join("\n");

  return [
    "You are an expert assistant.",
    `Role: ${spec.role}`,
    `Job: ${spec.objective}`,
    "Rules:",
    rules,
    `Output format: ${spec.outputFormat}`,
    "Success criteria:",
    success
  ].join("\n");
}

export const anthropicAdapter: ProviderAdapter = {
  buildRequest(spec: CanonicalPromptSpec, contextWindow: ContextWindow, model: ModelConfig): ProviderRequest {
    return {
      provider: "anthropic",
      model: model.model,
      payload: {
        model: model.model,
        max_tokens: model.maxOutputTokens,
        system: buildInstruction(spec),
        messages: [
          ...contextWindow.messages.flatMap((message) =>
            message.contentBlocks
              .filter((block) => block.type === "text")
              .map((block) => ({
                role: message.role === "assistant" ? "assistant" : "user",
                content: [{ type: "text", text: block.text }]
              }))
          ),
          { role: "user", content: [{ type: "text", text: spec.userDraft }] }
        ],
        stream: true
      }
    };
  },

  async *streamResponse(request: ProviderRequest, apiKey: string): AsyncIterable<CanonicalStreamEvent> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(request.payload)
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic HTTP ${response.status}: ${body}`);
    }

    for await (const event of iterateSSE(response)) {
      if (event.event === "message_stop") {
        yield { type: "final", finishReason: "end_turn" };
        return;
      }

      const parsed = safeParseJson<{
        type?: string;
        delta?: { text?: string };
        stop_reason?: string;
      }>(event.data);

      if (!parsed) {
        continue;
      }

      if (parsed.type === "content_block_delta" && parsed.delta?.text) {
        yield { type: "delta", text: parsed.delta.text, raw: parsed as Record<string, unknown> };
      }

      if (parsed.type === "message_delta" && parsed.stop_reason) {
        yield {
          type: "final",
          finishReason: parsed.stop_reason,
          raw: parsed as Record<string, unknown>
        };
        return;
      }
    }
  },

  normalizeError(error: unknown): CanonicalProviderError {
    const message = error instanceof Error ? error.message : "Unknown Anthropic error";
    const lower = message.toLowerCase();
    return {
      provider: "anthropic",
      code: lower.includes("safety") ? "safety" : lower.includes("rate") ? "rate_limit" : lower.includes("auth") ? "auth" : "unknown",
      message,
      retryable: lower.includes("rate") || lower.includes("timeout") || lower.includes("network")
    };
  },

  estimateTokens(request: ProviderRequest): TokenEstimate {
    const payloadText = JSON.stringify(request.payload);
    return {
      promptTokens: estimateCharacterTokens(payloadText),
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS
    };
  }
};
