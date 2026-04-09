import { getAdapter } from "@mvp/adapters";
import {
  applyProviderOverride,
  buildCanonicalPromptSpec,
  COST_PER_TOKEN,
  DEFAULT_MAX_CONTEXT_MESSAGES,
  DEFAULT_MAX_INPUT_TOKENS,
  DEFAULT_MAX_OUTPUT_TOKENS,
  enforceTokenBudget,
  nowIso,
  ProviderConfigError,
  type ContentBlock,
  type Message,
  type ModelConfig
} from "@mvp/core";
import type { Repository } from "@mvp/storage";
import type { SendMessageInput, SendMessageResult } from "./contracts.js";

function stringifyPrompt(spec: ReturnType<typeof buildCanonicalPromptSpec>): string {
  return [
    `ROLE: ${spec.role}`,
    `OBJECTIVE: ${spec.objective}`,
    "CONTEXT:",
    ...spec.context.map((item) => `- ${item}`),
    "CONSTRAINTS:",
    ...spec.constraints.map((item) => `- ${item}`),
    `OUTPUT_FORMAT: ${spec.outputFormat}`,
    "QUALITY_BAR:",
    ...spec.qualityBar.map((item) => `- ${item}`),
    `USER_INPUT: ${spec.userDraft}`
  ].join("\n");
}

export class ChatService {
  constructor(
    private readonly repository: Repository,
    private readonly resolveApiKey: (provider: SendMessageInput["provider"]) => Promise<string | undefined>
  ) {}

  async *sendMessage(input: SendMessageInput): AsyncIterable<string | SendMessageResult> {
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    const textBlocks: ContentBlock[] = [{ type: "text", text: input.text }];

    const userMessage: Message = {
      id: userMessageId,
      projectId: input.projectId,
      threadId: input.threadId,
      role: "user",
      contentBlocks: textBlocks,
      metadata: {
        providerUsed: input.provider,
        modelUsed: input.model
      },
      createdAt: nowIso()
    };

    await this.repository.createMessage(userMessage);

    const priorMessages = await this.repository.listMessages(input.threadId);
    const pack = input.enhance ? await this.repository.getEnhancerPack(input.projectId) : undefined;

    const modelConfig: ModelConfig = {
      provider: input.provider,
      model: input.model,
      maxInputTokens: DEFAULT_MAX_INPUT_TOKENS,
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS
    };

    let canonicalSpec = buildCanonicalPromptSpec({
      pack,
      templateId: input.templateId,
      projectInstructions: ["Keep responses reproducible and auditable."],
      contextWindow: {
        messages: priorMessages,
        maxMessages: DEFAULT_MAX_CONTEXT_MESSAGES
      },
      userDraft: input.text
    });

    canonicalSpec = applyProviderOverride(canonicalSpec, pack, input.provider);
    const renderedPrompt = stringifyPrompt(canonicalSpec);
    const budgetedPrompt = enforceTokenBudget(renderedPrompt, modelConfig);

    const runId = crypto.randomUUID();
    await this.repository.createRun({
      id: runId,
      threadId: input.threadId,
      userMessageId: userMessageId,
      provider: input.provider,
      model: input.model,
      transformedPromptSnapshot: budgetedPrompt.prompt,
      status: "running",
      createdAt: nowIso()
    });

    const adapter = getAdapter(input.provider);
    const request = adapter.buildRequest(
      canonicalSpec,
      { messages: priorMessages, maxMessages: DEFAULT_MAX_CONTEXT_MESSAGES },
      modelConfig
    );
    const apiKey = await this.resolveApiKey(input.provider);
    if (!apiKey) {
      throw new ProviderConfigError(input.provider);
    }

    let collected = "";
    const started = Date.now();

    try {
      for await (const event of adapter.streamResponse(request, apiKey)) {
        if (event.type === "delta" && event.text) {
          collected += event.text;
          yield event.text;
        }
        if (event.type === "error") {
          await this.repository.updateRun(runId, {
            status: "failed",
            rawResponseJson: event.raw
          });
          throw new Error(event.error?.message ?? "Provider stream failed");
        }
      }
    } catch (error) {
      const normalized = adapter.normalizeError(error);
      await this.repository.updateRun(runId, {
        status: "failed",
        rawResponseJson: { normalizedError: normalized }
      });
      throw new Error(`[${normalized.provider}] ${normalized.code}: ${normalized.message}`);
    }

    const latencyMs = Date.now() - started;

    const assistantMessage: Message = {
      id: assistantMessageId,
      projectId: input.projectId,
      threadId: input.threadId,
      role: "assistant",
      contentBlocks: [{ type: "text", text: collected }],
      metadata: {
        providerUsed: input.provider,
        modelUsed: input.model,
        transformedPromptSnapshot: budgetedPrompt.prompt,
        tokenIn: budgetedPrompt.promptTokens,
        tokenOut: Math.ceil(collected.length / 4),
        latencyMs,
        costEstimate: Number(((budgetedPrompt.promptTokens + collected.length / 4) * COST_PER_TOKEN).toFixed(6))
      },
      createdAt: nowIso()
    };

    await this.repository.createMessage(assistantMessage);

    await this.repository.updateRun(runId, {
      status: "complete",
      rawResponseJson: { text: collected },
      latencyMs,
      tokenIn: assistantMessage.metadata.tokenIn,
      tokenOut: assistantMessage.metadata.tokenOut,
      costEstimate: assistantMessage.metadata.costEstimate
    });

    yield {
      userMessage,
      assistantMessage,
      transformedPrompt: budgetedPrompt.prompt
    };
  }
}
