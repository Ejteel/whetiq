import type {
  CanonicalPromptSpec,
  ContextWindow,
  EnhancerPack,
  Message,
  ModelConfig,
  Provider,
  Template
} from "./types.js";

export interface BuildCanonicalPromptInput {
  pack?: EnhancerPack;
  templateId?: string;
  projectInstructions: string[];
  contextWindow: ContextWindow;
  userDraft: string;
}

function pickTemplate(pack: EnhancerPack | undefined, templateId: string | undefined): Template | undefined {
  if (!pack || !templateId) {
    return undefined;
  }
  return pack.templates.find((template) => template.id === templateId);
}

function extractRecentContext(messages: Message[], limit: number): string[] {
  return messages
    .slice(-Math.max(limit, 1))
    .flatMap((message) =>
      message.contentBlocks
        .filter((block) => block.type === "text")
        .map((block) => `[${message.role}] ${block.text}`)
    );
}

export function buildCanonicalPromptSpec(input: BuildCanonicalPromptInput): CanonicalPromptSpec {
  const template = pickTemplate(input.pack, input.templateId);

  const context: string[] = [];
  context.push(...input.projectInstructions);
  if (input.contextWindow.summary) {
    context.push(`Thread summary: ${input.contextWindow.summary}`);
  }
  context.push(...extractRecentContext(input.contextWindow.messages, input.contextWindow.maxMessages));

  const constraints = [
    ...(input.pack?.houseRules ?? []),
    ...(template?.constraints ?? [])
  ];

  const qualityBar = template?.qualityChecks ?? ["Deliver a direct, high-signal response."];

  return {
    role: "Expert assistant for project context",
    objective: template?.purpose ?? "Address the user request accurately",
    context,
    constraints,
    outputFormat: template?.outputFormat ?? "Clear markdown with concise sections",
    qualityBar,
    missingInfoQuestions:
      template?.missingInfoQuestions ?? ["What outcome format do you prefer?", "Any constraints to respect?"],
    userDraft: input.userDraft
  };
}

export function applyProviderOverride(
  spec: CanonicalPromptSpec,
  pack: EnhancerPack | undefined,
  provider: Provider
): CanonicalPromptSpec {
  const override = pack?.providerOverrides[provider];
  if (!override) {
    return spec;
  }

  const prefixedObjective = override.instructionPrefix
    ? `${override.instructionPrefix}: ${spec.objective}`
    : spec.objective;

  const constraints = [...spec.constraints, ...(override.enforceFormatting ?? [])];

  return {
    ...spec,
    objective: prefixedObjective,
    constraints
  };
}

export function serializeSpecToPromptString(spec: CanonicalPromptSpec): string {
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

export function estimateCharacterTokens(input: string): number {
  return Math.ceil(input.length / 4);
}

export function enforceTokenBudget(
  prompt: string,
  model: ModelConfig
): { prompt: string; promptTokens: number; truncated: boolean } {
  const estimated = estimateCharacterTokens(prompt);
  if (estimated <= model.maxInputTokens) {
    return { prompt, promptTokens: estimated, truncated: false };
  }

  const maxChars = model.maxInputTokens * 4;
  const truncatedPrompt = `${prompt.slice(0, Math.max(0, maxChars - 32))}\n\n[TRUNCATED_FOR_TOKEN_BUDGET]`;
  return {
    prompt: truncatedPrompt,
    promptTokens: estimateCharacterTokens(truncatedPrompt),
    truncated: true
  };
}
