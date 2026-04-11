import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb, getPgPool } from "./db/client";
import { adminUsers, auditLogs, runtimeSettings, schemaMigrations } from "./db/schema";

export type AdminRole = "viewer" | "operator" | "super_admin";
export type RuntimeMode = "demo" | "private_live";

let initialized = false;
let initPromise: Promise<void> | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function parseCsv(input?: string): string[] {
  if (!input) {
    return [];
  }
  return input
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

async function runPendingMigrations(): Promise<void> {
  const db = getDb();
  const pool = getPgPool();
  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query("SELECT pg_advisory_lock($1)", [982451653]);
  try {
    for (const name of files) {
      const existing = await db
        .select({ name: schemaMigrations.name })
        .from(schemaMigrations)
        .where(eq(schemaMigrations.name, name))
        .limit(1);
      if (existing.length > 0) {
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, name), "utf8");
      await pool.query("BEGIN");
      try {
        await pool.query(sql);
        await pool.query("INSERT INTO schema_migrations (name, applied_at) VALUES ($1, NOW())", [name]);
        await pool.query("COMMIT");
      } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await pool.query("SELECT pg_advisory_unlock($1)", [982451653]);
  }
}

export async function bootstrapSuperAdmins(): Promise<void> {
  const db = getDb();
  const superAdmins = parseCsv(process.env.ADMIN_SUPER_ADMIN_EMAILS);
  const now = new Date();

  for (const email of superAdmins) {
    await db
      .insert(adminUsers)
      .values({
        email,
        role: "super_admin",
        createdAt: now,
        updatedAt: now,
        createdBy: "bootstrap"
      })
      .onConflictDoUpdate({
        target: adminUsers.email,
        set: {
          role: "super_admin",
          updatedAt: now
        }
      });
  }
}

export async function initControlPlane(): Promise<void> {
  if (initialized) {
    return;
  }

  if (!initPromise) {
    initPromise = (async () => {
      await runPendingMigrations();
      await bootstrapSuperAdmins();
      initialized = true;
    })();
  }

  await initPromise;
}

export async function getRoleByEmail(email: string): Promise<AdminRole | null> {
  await initControlPlane();
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const row = await db.select({ role: adminUsers.role }).from(adminUsers).where(eq(adminUsers.email, normalized)).limit(1);
  const role = row[0]?.role;
  if (role === "viewer" || role === "operator" || role === "super_admin") {
    return role;
  }
  return null;
}

export async function upsertAdminUser(email: string, role: AdminRole, actorEmail: string): Promise<void> {
  await initControlPlane();
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const actor = actorEmail.trim().toLowerCase();
  const now = new Date();

  await db
    .insert(adminUsers)
    .values({
      email: normalized,
      role,
      createdAt: now,
      updatedAt: now,
      createdBy: actor
    })
    .onConflictDoUpdate({
      target: adminUsers.email,
      set: {
        role,
        updatedAt: now
      }
    });

  await appendAudit(actor, "admin.user.upsert", normalized, JSON.stringify({ role }));
}

export async function listAdminUsers(): Promise<Array<{ email: string; role: AdminRole; updatedAt: string }>> {
  await initControlPlane();
  const db = getDb();
  const rows = await db.select().from(adminUsers);

  const rank: Record<AdminRole, number> = {
    super_admin: 3,
    operator: 2,
    viewer: 1
  };

  return rows
    .map((row) => ({
      email: row.email,
      role: row.role as AdminRole,
      updatedAt: row.updatedAt.toISOString()
    }))
    .sort((a, b) => {
      const roleCmp = rank[b.role] - rank[a.role];
      if (roleCmp !== 0) {
        return roleCmp;
      }
      return a.email.localeCompare(b.email);
    });
}

export async function getRuntimeMode(appId: string): Promise<RuntimeMode> {
  await initControlPlane();
  const db = getDb();
  const rows = await db.select({ mode: runtimeSettings.mode }).from(runtimeSettings).where(eq(runtimeSettings.appId, appId)).limit(1);
  return rows[0]?.mode === "demo" ? "demo" : "private_live";
}

export async function setRuntimeMode(appId: string, mode: RuntimeMode, actorEmail: string): Promise<void> {
  await initControlPlane();
  const db = getDb();
  const actor = actorEmail.trim().toLowerCase();
  const now = new Date();

  await db
    .insert(runtimeSettings)
    .values({
      appId,
      mode,
      updatedAt: now,
      updatedBy: actor
    })
    .onConflictDoUpdate({
      target: runtimeSettings.appId,
      set: {
        mode,
        updatedAt: now,
        updatedBy: actor
      }
    });

  await appendAudit(actor, "runtime.mode.set", appId, JSON.stringify({ mode }));
}

export async function appendAudit(actorEmail: string, action: string, target: string, metadata: string): Promise<void> {
  await initControlPlane();
  const db = getDb();

  await db.insert(auditLogs).values({
    actorEmail: actorEmail.toLowerCase(),
    action,
    target,
    metadata,
    createdAt: new Date(nowIso())
  });
}
