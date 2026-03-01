import type { Message, Provider } from "@mvp/core";

export interface SendMessageInput {
  projectId: string;
  threadId: string;
  provider: Provider;
  model: string;
  text: string;
  templateId?: string;
  enhance: boolean;
  attachmentIds?: string[];
}

export interface SendMessageResult {
  userMessage: Message;
  assistantMessage: Message;
  transformedPrompt: string;
}

export interface StreamChunk {
  threadId: string;
  messageId: string;
  delta: string;
}
