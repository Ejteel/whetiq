export type Provider = "openai" | "anthropic" | "gemini";

export type MessageRole = "system" | "user" | "assistant" | "tool";

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "file_ref"; attachmentId: string; fileName: string; mimeType: string }
  | { type: "structured_json"; payload: Record<string, unknown> }
  | { type: "provider_raw"; provider: Provider; payload: Record<string, unknown> };

export interface MessageMetadata {
  providerUsed?: Provider;
  modelUsed?: string;
  enhancerPackVersion?: number;
  transformedPromptSnapshot?: string;
  tokenIn?: number;
  tokenOut?: number;
  latencyMs?: number;
  costEstimate?: number;
  doNotLogPrompts?: boolean;
}

export interface Message {
  id: string;
  projectId: string;
  threadId: string;
  role: MessageRole;
  contentBlocks: ContentBlock[];
  metadata: MessageMetadata;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Thread {
  id: string;
  projectId: string;
  name: string;
  defaultProvider: Provider;
  defaultModel: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequiredInput {
  key: string;
  description: string;
}

export interface Template {
  id: string;
  name: string;
  purpose: string;
  requiredInputs: RequiredInput[];
  outputFormat: string;
  constraints: string[];
  qualityChecks: string[];
  missingInfoQuestions: string[];
}

export interface ProviderOverride {
  instructionPrefix?: string;
  enforceFormatting?: string[];
  trimPriority?: string[];
}

export interface EnhancerPack {
  id: string;
  projectId: string;
  name: string;
  version: number;
  houseRules: string[];
  templates: Template[];
  providerOverrides: Partial<Record<Provider, ProviderOverride>>;
}

export interface CanonicalPromptSpec {
  role: string;
  objective: string;
  context: string[];
  constraints: string[];
  outputFormat: string;
  qualityBar: string[];
  missingInfoQuestions: string[];
  userDraft: string;
}

export interface ContextWindow {
  messages: Message[];
  summary?: string;
  maxMessages: number;
}

export interface ModelConfig {
  provider: Provider;
  model: string;
  maxInputTokens: number;
  maxOutputTokens: number;
}

export interface ProviderRequest {
  provider: Provider;
  model: string;
  payload: Record<string, unknown>;
}

export interface CanonicalStreamEvent {
  type: "delta" | "final" | "error";
  text?: string;
  raw?: Record<string, unknown>;
  finishReason?: string;
  error?: CanonicalProviderError;
}

export interface CanonicalProviderError {
  code: "rate_limit" | "auth" | "context_length" | "safety" | "network" | "unknown";
  message: string;
  provider: Provider;
  retryable: boolean;
}

export interface TokenEstimate {
  promptTokens: number;
  maxOutputTokens: number;
}

export interface RoutingRecommendation {
  provider: Provider;
  reason: string;
  confidence: number;
}
