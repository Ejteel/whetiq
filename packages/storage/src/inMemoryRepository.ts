import type { EnhancerPack, Message, Project, Thread } from "@mvp/core";
import type { Attachment, ProviderAccount, Repository, RunRecord } from "./repository.js";

function nowIso(): string {
  return new Date().toISOString();
}

export class InMemoryRepository implements Repository {
  private readonly projects = new Map<string, Project>();
  private readonly threads = new Map<string, Thread>();
  private readonly messages = new Map<string, Message>();
  private readonly packs = new Map<string, EnhancerPack>();
  private readonly providerAccounts = new Map<string, ProviderAccount>();
  private readonly attachments = new Map<string, Attachment>();
  private readonly runs = new Map<string, RunRecord>();

  async createProject(input: Pick<Project, "name">): Promise<Project> {
    const project: Project = { id: crypto.randomUUID(), name: input.name, createdAt: nowIso(), updatedAt: nowIso() };
    this.projects.set(project.id, project);
    return project;
  }

  async listProjects(): Promise<Project[]> {
    return [...this.projects.values()];
  }

  async createThread(input: Pick<Thread, "projectId" | "name" | "defaultProvider" | "defaultModel">): Promise<Thread> {
    const thread: Thread = {
      id: crypto.randomUUID(),
      projectId: input.projectId,
      name: input.name,
      defaultProvider: input.defaultProvider,
      defaultModel: input.defaultModel,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    this.threads.set(thread.id, thread);
    return thread;
  }

  async listThreads(projectId: string): Promise<Thread[]> {
    return [...this.threads.values()].filter((thread) => thread.projectId === projectId);
  }

  async createMessage(input: Message): Promise<Message> {
    const message: Message = { ...input, createdAt: input.createdAt || nowIso() };
    this.messages.set(message.id, message);
    return message;
  }

  async listMessages(threadId: string): Promise<Message[]> {
    return [...this.messages.values()].filter((message) => message.threadId === threadId);
  }

  async upsertEnhancerPack(pack: EnhancerPack): Promise<void> {
    this.packs.set(pack.projectId, pack);
  }

  async getEnhancerPack(projectId: string): Promise<EnhancerPack | undefined> {
    return this.packs.get(projectId);
  }

  async upsertProviderAccount(account: ProviderAccount): Promise<void> {
    this.providerAccounts.set(account.id, account);
  }

  async listProviderAccounts(): Promise<ProviderAccount[]> {
    return [...this.providerAccounts.values()];
  }

  async createAttachment(attachment: Attachment): Promise<void> {
    this.attachments.set(attachment.id, attachment);
  }

  async listAttachments(threadId: string): Promise<Attachment[]> {
    return [...this.attachments.values()].filter((attachment) => attachment.threadId === threadId);
  }

  async createRun(run: RunRecord): Promise<void> {
    this.runs.set(run.id, run);
  }

  async updateRun(runId: string, patch: Partial<RunRecord>): Promise<void> {
    const current = this.runs.get(runId);
    if (!current) {
      return;
    }
    this.runs.set(runId, { ...current, ...patch });
  }
}
