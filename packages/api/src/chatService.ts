import { getAdapter } from "@mvp/adapters";
import {
  applyProviderOverride,
  buildCanonicalPromptSpec,
  type CanonicalPromptSpec,
  COST_PER_TOKEN,
  DEFAULT_MAX_CONTEXT_MESSAGES,
  DEFAULT_MAX_INPUT_TOKENS,
  DEFAULT_MAX_OUTPUT_TOKENS,
  enforceTokenBudget,
  nowIso,
  ProviderConfigError,
  serializeSpecToPromptString,
  type ContentBlock,
  type Message,
  type ModelConfig,
  type ProviderRequest
} from "@mvp/core";
import type { Repository } from "@mvp/storage";
import type { SendMessageInput, SendMessageResult } from "./contracts.js";

interface PromptContext {
  priorMessages: Message[];
  budgetedPrompt: ReturnType<typeof enforceTokenBudget>;
  request: ProviderRequest;
}

interface StreamResult {
  collected: string;
  latencyMs: number;
}

export class ChatService {
  constructor(
    private readonly repository: Repository,
    private readonly resolveApiKey: (provider: SendMessageInput["provider"]) => Promise<string | undefined>
  ) {}

  async *sendMessage(input: SendMessageInput): AsyncIterable<string | SendMessageResult> {
    const userMessage = await this.#persistUserMessage(input);
    const promptContext = await this.#buildPromptContext(input);
    const runId = await this.#createRun(input, userMessage.id, promptContext.budgetedPrompt.prompt);
    const streamResult = yield* this.#streamFromProvider(input, promptContext.request, runId);
    yield await this.#persistResult(input, userMessage, promptContext.budgetedPrompt, streamResult, runId);
  }

  async #persistUserMessage(input: SendMessageInput): Promise<Message> {
    const userMessage = this.#createUserMessage(input);
    await this.repository.createMessage(userMessage);
    return userMessage;
  }

  #createUserMessage(input: SendMessageInput): Message {
    const textBlocks: ContentBlock[] = [{ type: "text", text: input.text }];
    return {
      id: crypto.randomUUID(),
      projectId: input.projectId,
      threadId: input.threadId,
      role: "user",
      contentBlocks: textBlocks,
      metadata: { providerUsed: input.provider, modelUsed: input.model },
      createdAt: nowIso()
    };
  }

  async #buildPromptContext(input: SendMessageInput): Promise<PromptContext> {
    const priorMessages = await this.repository.listMessages(input.threadId);
    const modelConfig = this.#buildModelConfig(input);
    const canonicalSpec = await this.#buildCanonicalSpec(input, priorMessages);
    const renderedPrompt = serializeSpecToPromptString(canonicalSpec);
    const budgetedPrompt = enforceTokenBudget(renderedPrompt, modelConfig);
    const request = this.#buildRequest(input, canonicalSpec, priorMessages, modelConfig);
    return { priorMessages, budgetedPrompt, request };
  }

  #buildModelConfig(input: SendMessageInput): ModelConfig {
    return {
      provider: input.provider,
      model: input.model,
      maxInputTokens: DEFAULT_MAX_INPUT_TOKENS,
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS
    };
  }

  async #buildCanonicalSpec(input: SendMessageInput, priorMessages: Message[]): Promise<CanonicalPromptSpec> {
    const pack = input.enhance ? await this.repository.getEnhancerPack(input.projectId) : undefined;
    const canonicalSpec = buildCanonicalPromptSpec({
      pack,
      templateId: input.templateId,
      projectInstructions: ["Keep responses reproducible and auditable."],
      contextWindow: { messages: priorMessages, maxMessages: DEFAULT_MAX_CONTEXT_MESSAGES },
      userDraft: input.text
    });
    return applyProviderOverride(canonicalSpec, pack, input.provider);
  }

  #buildRequest(
    input: SendMessageInput,
    canonicalSpec: CanonicalPromptSpec,
    priorMessages: Message[],
    modelConfig: ModelConfig
  ): ProviderRequest {
    return getAdapter(input.provider).buildRequest(
      canonicalSpec,
      { messages: priorMessages, maxMessages: DEFAULT_MAX_CONTEXT_MESSAGES },
      modelConfig
    );
  }

  async #createRun(input: SendMessageInput, userMessageId: string, prompt: string): Promise<string> {
    const runId = crypto.randomUUID();
    await this.repository.createRun({
      id: runId,
      threadId: input.threadId,
      userMessageId,
      provider: input.provider,
      model: input.model,
      transformedPromptSnapshot: prompt,
      status: "running",
      createdAt: nowIso()
    });
    return runId;
  }

  async *#streamFromProvider(
    input: SendMessageInput,
    request: ProviderRequest,
    runId: string
  ): AsyncGenerator<string, StreamResult> {
    const adapter = getAdapter(input.provider);
    const apiKey = await this.#requireApiKey(input.provider);
    const started = Date.now();
    try {
      const collected = yield* this.#collectProviderStream(adapter, request, apiKey, runId);
      return { collected, latencyMs: Date.now() - started };
    } catch (error) {
      throw await this.#handleStreamFailure(adapter, error, runId);
    }
  }

  async #requireApiKey(provider: SendMessageInput["provider"]): Promise<string> {
    const apiKey = await this.resolveApiKey(provider);
    if (!apiKey) {
      throw new ProviderConfigError(provider);
    }
    return apiKey;
  }

  async *#collectProviderStream(
    adapter: ReturnType<typeof getAdapter>,
    request: ProviderRequest,
    apiKey: string,
    runId: string
  ): AsyncGenerator<string, string> {
    let collected = "";
    for await (const event of adapter.streamResponse(request, apiKey)) {
      if (event.type === "delta" && event.text) {
        collected += event.text;
        yield event.text;
      }
      if (event.type === "error") {
        await this.#recordRunFailure(runId, event.raw);
        throw new Error(event.error?.message ?? "Provider stream failed");
      }
    }
    return collected;
  }

  async #recordRunFailure(runId: string, rawResponseJson: Record<string, unknown> | undefined): Promise<void> {
    await this.repository.updateRun(runId, { status: "failed", rawResponseJson });
  }

  async #handleStreamFailure(
    adapter: ReturnType<typeof getAdapter>,
    error: unknown,
    runId: string
  ): Promise<Error> {
    const normalized = adapter.normalizeError(error);
    await this.#recordRunFailure(runId, { normalizedError: normalized });
    return new Error(`[${normalized.provider}] ${normalized.code}: ${normalized.message}`);
  }

  async #persistResult(
    input: SendMessageInput,
    userMessage: Message,
    budgetedPrompt: ReturnType<typeof enforceTokenBudget>,
    streamResult: StreamResult,
    runId: string
  ): Promise<SendMessageResult> {
    const assistantMessage = await this.#createAssistantMessage(input, budgetedPrompt, streamResult);
    await this.repository.updateRun(runId, this.#buildRunCompletionPatch(assistantMessage, streamResult.collected));
    return { userMessage, assistantMessage, transformedPrompt: budgetedPrompt.prompt };
  }

  async #createAssistantMessage(
    input: SendMessageInput,
    budgetedPrompt: ReturnType<typeof enforceTokenBudget>,
    streamResult: StreamResult
  ): Promise<Message> {
    const assistantMessage = this.#buildAssistantMessage(input, budgetedPrompt, streamResult);
    await this.repository.createMessage(assistantMessage);
    return assistantMessage;
  }

  #buildAssistantMessage(
    input: SendMessageInput,
    budgetedPrompt: ReturnType<typeof enforceTokenBudget>,
    streamResult: StreamResult
  ): Message {
    return {
      id: crypto.randomUUID(),
      projectId: input.projectId,
      threadId: input.threadId,
      role: "assistant",
      contentBlocks: [{ type: "text", text: streamResult.collected }],
      metadata: this.#buildAssistantMetadata(input, budgetedPrompt, streamResult),
      createdAt: nowIso()
    };
  }

  #buildAssistantMetadata(
    input: SendMessageInput,
    budgetedPrompt: ReturnType<typeof enforceTokenBudget>,
    streamResult: StreamResult
  ): Message["metadata"] {
    const tokenOut = Math.ceil(streamResult.collected.length / 4);
    const costEstimate = Number(((budgetedPrompt.promptTokens + streamResult.collected.length / 4) * COST_PER_TOKEN).toFixed(6));
    return {
      providerUsed: input.provider,
      modelUsed: input.model,
      transformedPromptSnapshot: budgetedPrompt.prompt,
      tokenIn: budgetedPrompt.promptTokens,
      tokenOut,
      latencyMs: streamResult.latencyMs,
      costEstimate
    };
  }

  #buildRunCompletionPatch(assistantMessage: Message, collected: string): {
    status: "complete";
    rawResponseJson: { text: string };
    latencyMs: number | undefined;
    tokenIn: number | undefined;
    tokenOut: number | undefined;
    costEstimate: number | undefined;
  } {
    return {
      status: "complete" as const,
      rawResponseJson: { text: collected },
      latencyMs: assistantMessage.metadata.latencyMs,
      tokenIn: assistantMessage.metadata.tokenIn,
      tokenOut: assistantMessage.metadata.tokenOut,
      costEstimate: assistantMessage.metadata.costEstimate
    };
  }
}
