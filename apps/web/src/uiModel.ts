import type { EnhancerPack, Message, Provider, RoutingRecommendation, Thread } from "@mvp/core";

export interface ComposerState {
  selectedProvider: Provider;
  selectedModel: string;
  enhanceEnabled: boolean;
  showTransformedPrompt: boolean;
  tokenWarning?: string;
}

export interface ChatViewState {
  thread: Thread;
  messages: Message[];
  recommendation?: RoutingRecommendation;
  transformedPromptPreview?: string;
  composer: ComposerState;
  enhancerPack?: EnhancerPack;
}
