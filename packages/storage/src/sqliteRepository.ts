/**
 * @remarks LOCAL DEVELOPMENT ONLY - not compatible with Vercel serverless. Use Neon/PostgreSQL in production.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { nowIso, type EnhancerPack, type Message, type Project, type Thread } from "@mvp/core";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import {
  attachmentsTable,
  enhancerPacksTable,
  messagesTable,
  projectsTable,
  providerAccountsTable,
  runsTable,
  threadsTable
} from "./drizzleSchema.js";
import type { Attachment, ProviderAccount, Repository, RunRecord } from "./repository.js";

function parseJson<T>(input: string): T {
  return JSON.parse(input) as T;
}

export class SQLiteRepository implements Repository {
  private readonly sqlite: Database.Database;
  private readonly db: ReturnType<typeof drizzle>;

  constructor(dbPath: string) {
    this.sqlite = new Database(dbPath);
    this.db = drizzle(this.sqlite);
    this.applyMigrations();
  }

  private applyMigrations(): void {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = dirname(currentFile);
    const migrationPath = resolve(currentDir, "../drizzle/0000_initial.sql");
    const sql = readFileSync(migrationPath, "utf8");
    try {
      this.sqlite.exec(sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.toLowerCase().includes("already exists")) {
        throw error;
      }
    }
  }

  async createProject(input: Pick<Project, "name">): Promise<Project> {
    const now = nowIso();
    const project: Project = { id: crypto.randomUUID(), name: input.name, createdAt: now, updatedAt: now };
    this.db.insert(projectsTable).values({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }).run();
    return project;
  }

  async listProjects(): Promise<Project[]> {
    const rows = this.db.select().from(projectsTable).all();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  async createThread(input: Pick<Thread, "projectId" | "name" | "defaultProvider" | "defaultModel">): Promise<Thread> {
    const now = nowIso();
    const thread: Thread = {
      id: crypto.randomUUID(),
      projectId: input.projectId,
      name: input.name,
      defaultProvider: input.defaultProvider,
      defaultModel: input.defaultModel,
      createdAt: now,
      updatedAt: now
    };

    this.db.insert(threadsTable).values({
      id: thread.id,
      projectId: thread.projectId,
      name: thread.name,
      defaultProvider: thread.defaultProvider,
      defaultModel: thread.defaultModel,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt
    }).run();

    return thread;
  }

  async listThreads(projectId: string): Promise<Thread[]> {
    const rows = this.db.select().from(threadsTable).where(eq(threadsTable.projectId, projectId)).all();
    return rows.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      name: row.name,
      defaultProvider: row.defaultProvider as Thread["defaultProvider"],
      defaultModel: row.defaultModel,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  async createMessage(input: Message): Promise<Message> {
    this.db.insert(messagesTable).values({
      id: input.id,
      threadId: input.threadId,
      role: input.role,
      contentJson: JSON.stringify(input.contentBlocks),
      metadataJson: JSON.stringify(input.metadata),
      createdAt: input.createdAt
    }).run();
    return input;
  }

  async listMessages(threadId: string): Promise<Message[]> {
    const rows = this.db.select().from(messagesTable).where(eq(messagesTable.threadId, threadId)).all();
    const thread = this.db.select().from(threadsTable).where(eq(threadsTable.id, threadId)).get();
    return rows.map((row) => ({
      id: row.id,
      projectId: thread?.projectId ?? "",
      threadId: row.threadId,
      role: row.role as Message["role"],
      contentBlocks: parseJson(row.contentJson),
      metadata: parseJson(row.metadataJson),
      createdAt: row.createdAt
    }));
  }

  async upsertEnhancerPack(pack: EnhancerPack): Promise<void> {
    this.db
      .insert(enhancerPacksTable)
      .values({
        id: pack.id,
        projectId: pack.projectId,
        name: pack.name,
        version: pack.version,
        rulesJson: JSON.stringify(pack),
        createdAt: nowIso(),
        updatedAt: nowIso()
      })
      .onConflictDoUpdate({
        target: enhancerPacksTable.id,
        set: {
          name: pack.name,
          version: pack.version,
          rulesJson: JSON.stringify(pack),
          updatedAt: nowIso()
        }
      })
      .run();
  }

  async getEnhancerPack(projectId: string): Promise<EnhancerPack | undefined> {
    const row = this.db
      .select()
      .from(enhancerPacksTable)
      .where(eq(enhancerPacksTable.projectId, projectId))
      .get();

    if (!row) {
      return undefined;
    }

    return parseJson<EnhancerPack>(row.rulesJson);
  }

  async upsertProviderAccount(account: ProviderAccount): Promise<void> {
    this.db
      .insert(providerAccountsTable)
      .values({
        id: account.id,
        provider: account.provider,
        keychainRef: account.keychainRef,
        configJson: JSON.stringify(account.configJson),
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      })
      .onConflictDoUpdate({
        target: providerAccountsTable.id,
        set: {
          provider: account.provider,
          keychainRef: account.keychainRef,
          configJson: JSON.stringify(account.configJson),
          updatedAt: nowIso()
        }
      })
      .run();
  }

  async listProviderAccounts(): Promise<ProviderAccount[]> {
    const rows = this.db.select().from(providerAccountsTable).all();
    return rows.map((row) => ({
      id: row.id,
      provider: row.provider as ProviderAccount["provider"],
      keychainRef: row.keychainRef,
      configJson: parseJson(row.configJson),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  async createAttachment(attachment: Attachment): Promise<void> {
    this.db.insert(attachmentsTable).values({
      id: attachment.id,
      projectId: attachment.projectId,
      threadId: attachment.threadId,
      messageId: attachment.messageId ?? null,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      localPath: attachment.localPath,
      extractedText: attachment.extractedText ?? null,
      extractionStatus: attachment.extractionStatus,
      createdAt: attachment.createdAt
    }).run();
  }

  async listAttachments(threadId: string): Promise<Attachment[]> {
    const rows = this.db.select().from(attachmentsTable).where(eq(attachmentsTable.threadId, threadId)).all();
    return rows.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      threadId: row.threadId,
      messageId: row.messageId ?? undefined,
      fileName: row.fileName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      localPath: row.localPath,
      extractedText: row.extractedText ?? undefined,
      extractionStatus: row.extractionStatus as Attachment["extractionStatus"],
      createdAt: row.createdAt
    }));
  }

  async createRun(run: RunRecord): Promise<void> {
    this.db.insert(runsTable).values({
      id: run.id,
      threadId: run.threadId,
      userMessageId: run.userMessageId,
      provider: run.provider,
      model: run.model,
      transformedPromptSnapshot: run.transformedPromptSnapshot,
      rawResponseJson: run.rawResponseJson ? JSON.stringify(run.rawResponseJson) : null,
      status: run.status,
      latencyMs: run.latencyMs ?? null,
      tokenIn: run.tokenIn ?? null,
      tokenOut: run.tokenOut ?? null,
      costEstimate: run.costEstimate ?? null,
      createdAt: run.createdAt
    }).run();
  }

  async updateRun(runId: string, patch: Partial<RunRecord>): Promise<void> {
    const cleanPatch = Object.fromEntries(Object.entries({
      threadId: patch.threadId,
      userMessageId: patch.userMessageId,
      provider: patch.provider,
      model: patch.model,
      transformedPromptSnapshot: patch.transformedPromptSnapshot,
      rawResponseJson: patch.rawResponseJson ? JSON.stringify(patch.rawResponseJson) : undefined,
      status: patch.status,
      latencyMs: patch.latencyMs,
      tokenIn: patch.tokenIn,
      tokenOut: patch.tokenOut,
      costEstimate: patch.costEstimate,
      createdAt: patch.createdAt
    }).filter(([, value]) => value !== undefined));

    this.db
      .update(runsTable)
      .set(cleanPatch)
      .where(eq(runsTable.id, runId))
      .run();
  }
}
