import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

export type AdminRole = "viewer" | "operator" | "super_admin";
export type RuntimeMode = "demo" | "private_live";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "control-plane.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.exec(`
CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS runtime_settings (
  app_id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL
);
`);

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

export function bootstrapSuperAdmins(): void {
  const superAdmins = parseCsv(process.env.ADMIN_SUPER_ADMIN_EMAILS);
  const stamp = nowIso();
  const upsert = db.prepare(`
    INSERT INTO admin_users (email, role, created_at, updated_at, created_by)
    VALUES (@email, 'super_admin', @stamp, @stamp, 'bootstrap')
    ON CONFLICT(email) DO UPDATE SET role='super_admin', updated_at=@stamp
  `);

  for (const email of superAdmins) {
    upsert.run({ email, stamp });
  }
}

export function getRoleByEmail(email: string): AdminRole | null {
  const normalized = email.trim().toLowerCase();
  const row = db.prepare("SELECT role FROM admin_users WHERE email = ?").get(normalized) as { role?: string } | undefined;
  if (row?.role === "viewer" || row?.role === "operator" || row?.role === "super_admin") {
    return row.role;
  }
  return null;
}

export function upsertAdminUser(email: string, role: AdminRole, actorEmail: string): void {
  const normalized = email.trim().toLowerCase();
  const stamp = nowIso();
  db.prepare(`
    INSERT INTO admin_users (email, role, created_at, updated_at, created_by)
    VALUES (@email, @role, @stamp, @stamp, @actorEmail)
    ON CONFLICT(email) DO UPDATE SET role=@role, updated_at=@stamp
  `).run({ email: normalized, role, stamp, actorEmail: actorEmail.toLowerCase() });

  appendAudit(actorEmail, "admin.user.upsert", normalized, JSON.stringify({ role }));
}

export function listAdminUsers(): Array<{ email: string; role: AdminRole; updatedAt: string }> {
  const rows = db
    .prepare("SELECT email, role, updated_at FROM admin_users ORDER BY role DESC, email ASC")
    .all() as Array<{ email: string; role: AdminRole; updated_at: string }>;
  return rows.map((row) => ({ email: row.email, role: row.role, updatedAt: row.updated_at }));
}

export function getRuntimeMode(appId: string): RuntimeMode {
  const row = db
    .prepare("SELECT mode FROM runtime_settings WHERE app_id = ?")
    .get(appId) as { mode?: string } | undefined;
  return row?.mode === "demo" ? "demo" : "private_live";
}

export function setRuntimeMode(appId: string, mode: RuntimeMode, actorEmail: string): void {
  const stamp = nowIso();
  db.prepare(`
    INSERT INTO runtime_settings (app_id, mode, updated_at, updated_by)
    VALUES (@appId, @mode, @stamp, @actorEmail)
    ON CONFLICT(app_id) DO UPDATE SET mode=@mode, updated_at=@stamp, updated_by=@actorEmail
  `).run({ appId, mode, stamp, actorEmail: actorEmail.toLowerCase() });

  appendAudit(actorEmail, "runtime.mode.set", appId, JSON.stringify({ mode }));
}

export function appendAudit(actorEmail: string, action: string, target: string, metadata: string): void {
  db.prepare(
    "INSERT INTO audit_logs (actor_email, action, target, metadata, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(actorEmail.toLowerCase(), action, target, metadata, nowIso());
}

bootstrapSuperAdmins();
