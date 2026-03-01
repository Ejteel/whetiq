import type {
  CanonicalProviderError,
  CanonicalPromptSpec,
  CanonicalStreamEvent,
  ContextWindow,
  ModelConfig,
  ProviderRequest,
  TokenEstimate
} from "@mvp/core";
import { estimateCharacterTokens } from "@mvp/core";
import { iterateSSE, safeParseJson } from "../sse.js";
import type { ProviderAdapter } from "../types.js";

function composeSystemPrompt(spec: CanonicalPromptSpec): string {
  return [
    `ROLE: ${spec.role}`,
    `OBJECTIVE: ${spec.objective}`,
    "CONSTRAINTS:",
    ...spec.constraints.map((constraint) => `- ${constraint}`),
    `OUTPUT_FORMAT: ${spec.outputFormat}`,
    "QUALITY_BAR:",
    ...spec.qualityBar.map((check) => `- ${check}`)
  ].join("\n");
}

export const openAIAdapter: ProviderAdapter = {
  buildRequest(spec: CanonicalPromptSpec, contextWindow: ContextWindow, model: ModelConfig): ProviderRequest {
    return {
      provider: "openai",
      model: model.model,
      payload: {
        model: model.model,
        messages: [
          { role: "system", content: composeSystemPrompt(spec) },
          ...contextWindow.messages.flatMap((message) =>
            message.contentBlocks
              .filter((block) => block.type === "text")
              .map((block) => ({ role: message.role === "tool" ? "assistant" : message.role, content: block.text }))
          ),
          { role: "user", content: spec.userDraft }
        ],
        temperature: 0.2,
        stream: true
      }
    };
  },

  async *streamResponse(request: ProviderRequest, apiKey: string): AsyncIterable<CanonicalStreamEvent> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(request.payload)
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI HTTP ${response.status}: ${body}`);
    }

    for await (const event of iterateSSE(response)) {
      if (event.data === "[DONE]") {
        yield { type: "final", finishReason: "stop" };
        return;
      }

      const parsed = safeParseJson<{ choices?: Array<{ delta?: { content?: string }; finish_reason?: string }> }>(
        event.data
      );
      const choice = parsed?.choices?.[0];
      if (!choice) {
        continue;
      }

      if (choice.delta?.content) {
        yield { type: "delta", text: choice.delta.content, raw: parsed as Record<string, unknown> };
      }

      if (choice.finish_reason) {
        yield {
          type: "final",
          finishReason: choice.finish_reason,
          raw: parsed as Record<string, unknown>
        };
        return;
      }
    }
  },

  normalizeError(error: unknown): CanonicalProviderError {
    const message = error instanceof Error ? error.message : "Unknown OpenAI error";
    const lower = message.toLowerCase();

    return {
      provider: "openai",
      code: lower.includes("rate") ? "rate_limit" : lower.includes("auth") ? "auth" : lower.includes("context") ? "context_length" : "unknown",
      message,
      retryable: lower.includes("rate") || lower.includes("timeout") || lower.includes("network")
    };
  },

  estimateTokens(request: ProviderRequest): TokenEstimate {
    const payloadText = JSON.stringify(request.payload);
    return {
      promptTokens: estimateCharacterTokens(payloadText),
      maxOutputTokens: 2048
    };
  }
};
