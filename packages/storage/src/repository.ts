import type { EnhancerPack, Message, Project, Provider, Thread } from "@mvp/core";

export interface ProviderAccount {
  id: string;
  provider: Provider;
  keychainRef: string;
  configJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  projectId: string;
  threadId: string;
  messageId?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  localPath: string;
  extractedText?: string;
  extractionStatus: "pending" | "complete" | "failed";
  createdAt: string;
}

export interface RunRecord {
  id: string;
  threadId: string;
  userMessageId: string;
  provider: Provider;
  model: string;
  transformedPromptSnapshot: string;
  rawResponseJson?: Record<string, unknown>;
  status: "running" | "complete" | "failed";
  latencyMs?: number;
  tokenIn?: number;
  tokenOut?: number;
  costEstimate?: number;
  createdAt: string;
}

export interface Repository {
  createProject(input: Pick<Project, "name">): Promise<Project>;
  listProjects(): Promise<Project[]>;

  createThread(input: Pick<Thread, "projectId" | "name" | "defaultProvider" | "defaultModel">): Promise<Thread>;
  listThreads(projectId: string): Promise<Thread[]>;

  createMessage(input: Message): Promise<Message>;
  listMessages(threadId: string): Promise<Message[]>;

  upsertEnhancerPack(pack: EnhancerPack): Promise<void>;
  getEnhancerPack(projectId: string): Promise<EnhancerPack | undefined>;

  upsertProviderAccount(account: ProviderAccount): Promise<void>;
  listProviderAccounts(): Promise<ProviderAccount[]>;

  createAttachment(attachment: Attachment): Promise<void>;
  listAttachments(threadId: string): Promise<Attachment[]>;

  createRun(run: RunRecord): Promise<void>;
  updateRun(runId: string, patch: Partial<RunRecord>): Promise<void>;
}
