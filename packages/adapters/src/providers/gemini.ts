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

function buildInstructionText(spec: CanonicalPromptSpec): string {
  return [
    `Role: ${spec.role}`,
    `Objective: ${spec.objective}`,
    `Format: ${spec.outputFormat}`,
    `Constraints: ${spec.constraints.join(" | ")}`,
    `Quality bar: ${spec.qualityBar.join(" | ")}`
  ].join("\n");
}

export const geminiAdapter: ProviderAdapter = {
  buildRequest(spec: CanonicalPromptSpec, contextWindow: ContextWindow, model: ModelConfig): ProviderRequest {
    return {
      provider: "gemini",
      model: model.model,
      payload: {
        contents: [
          {
            role: "user",
            parts: [
              { text: buildInstructionText(spec) },
              ...contextWindow.messages.flatMap((message) =>
                message.contentBlocks
                  .filter((block) => block.type === "text")
                  .map((block) => ({ text: `${message.role}: ${block.text}` }))
              ),
              { text: `User input: ${spec.userDraft}` }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: model.maxOutputTokens,
          temperature: 0.2
        }
      }
    };
  },

  async *streamResponse(request: ProviderRequest, apiKey: string): AsyncIterable<CanonicalStreamEvent> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      request.model
    )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request.payload)
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini HTTP ${response.status}: ${body}`);
    }

    for await (const event of iterateSSE(response)) {
      const parsed = safeParseJson<{
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
        }>;
      }>(event.data);

      const candidate = parsed?.candidates?.[0];
      const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("");

      if (text) {
        yield { type: "delta", text, raw: parsed as Record<string, unknown> };
      }

      if (candidate?.finishReason) {
        yield {
          type: "final",
          finishReason: candidate.finishReason,
          raw: parsed as Record<string, unknown>
        };
        return;
      }
    }

    yield { type: "final", finishReason: "stop" };
  },

  normalizeError(error: unknown): CanonicalProviderError {
    const message = error instanceof Error ? error.message : "Unknown Gemini error";
    const lower = message.toLowerCase();
    return {
      provider: "gemini",
      code: lower.includes("context") ? "context_length" : lower.includes("auth") ? "auth" : "unknown",
      message,
      retryable: lower.includes("network") || lower.includes("timeout") || lower.includes("rate")
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
