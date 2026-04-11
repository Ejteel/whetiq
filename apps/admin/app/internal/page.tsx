"use client";

import type { JSX } from "react";
import { useEffect, useState } from "react";

type RuntimeMode = "demo" | "private_live";
type AdminRole = "viewer" | "operator" | "super_admin";

type UserRow = {
  email: string;
  role: AdminRole;
  updatedAt: string;
};

type ModeResponse = {
  mode: RuntimeMode;
  role: AdminRole | null;
};

type UsersResponse = {
  users: UserRow[];
};

function isAdminRole(value: unknown): value is AdminRole {
  return value === "viewer" || value === "operator" || value === "super_admin";
}

function isRuntimeMode(value: unknown): value is RuntimeMode {
  return value === "demo" || value === "private_live";
}

function parseModeResponse(value: unknown): ModeResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  return {
    mode: isRuntimeMode(candidate.mode) ? candidate.mode : "private_live",
    role: isAdminRole(candidate.role) ? candidate.role : null,
  };
}

function parseUsersResponse(value: unknown): UsersResponse {
  if (typeof value !== "object" || value === null) {
    return { users: [] };
  }

  const candidate = value as Record<string, unknown>;
  const users = Array.isArray(candidate.users)
    ? candidate.users.flatMap((user) => {
        if (typeof user !== "object" || user === null) {
          return [];
        }

        const userRow = user as Record<string, unknown>;
        if (
          typeof userRow.email !== "string" ||
          !isAdminRole(userRow.role) ||
          typeof userRow.updatedAt !== "string"
        ) {
          return [];
        }

        return [
          {
            email: userRow.email,
            role: userRow.role,
            updatedAt: userRow.updatedAt,
          },
        ];
      })
    : [];

  return { users };
}

export default function InternalPage(): JSX.Element {
  const [mode, setMode] = useState<RuntimeMode>("private_live");
  const [role, setRole] = useState<AdminRole | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("viewer");
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadControlPlaneState(): Promise<void> {
      const modeResponse = await fetch("/api/internal/mode");
      const modeJson: unknown = await modeResponse.json();
      const modeState = parseModeResponse(modeJson);
      if (modeState) {
        setMode(modeState.mode);
        setRole(modeState.role);
      }

      const usersResponse = await fetch("/api/internal/users");
      const usersJson: unknown = usersResponse.ok
        ? await usersResponse.json()
        : { users: [] };
      setUsers(parseUsersResponse(usersJson).users);
    }

    void loadControlPlaneState();
  }, []);

  async function updateMode(nextMode: RuntimeMode): Promise<void> {
    setStatus("Saving mode...");
    const response = await fetch("/api/internal/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId: "aggregator-web", mode: nextMode }),
    });

    if (!response.ok) {
      setStatus("Mode update failed.");
      return;
    }

    setMode(nextMode);
    setStatus(`Mode set to ${nextMode}.`);
  }

  async function addUser(): Promise<void> {
    setStatus("Updating user access...");
    const response = await fetch("/api/internal/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, role: newRole }),
    });
    if (!response.ok) {
      setStatus("User update failed.");
      return;
    }

    const json: unknown = await response.json();
    setUsers(parseUsersResponse(json).users);
    setNewEmail("");
    setStatus(`Updated ${newEmail}.`);
  }

  const canOperate = role === "operator" || role === "super_admin";
  const canManageUsers = role === "super_admin";
  const webBase = process.env.NEXT_PUBLIC_WEB_APP_URL ?? "https://whetiq.com";

  return (
    <main style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <h1>Internal Control Console</h1>
      <p>Role: {role ?? "loading"}</p>
      <p style={{ color: "#5c5546" }}>
        Runtime mode controls apply to the private workspace experience. Public
        demo workspace always stays in demo mode.
      </p>

      <section
        style={{
          border: "1px solid #d6cebf",
          background: "#fffaf2",
          borderRadius: 12,
          padding: 18,
          marginBottom: 16,
        }}
      >
        <h2>Aggregator Runtime Mode</h2>
        <p>
          Current mode: <strong>{mode}</strong>
        </p>
        <p style={{ marginTop: 4, color: "#5c5546" }}>
          Affects: <code>/private-workspace</code>. Does not change:{" "}
          <code>/workspace</code>.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            disabled={!canOperate}
            onClick={() => void updateMode("demo")}
          >
            Set Demo
          </button>
          <button
            type="button"
            disabled={!canOperate}
            onClick={() => void updateMode("private_live")}
          >
            Set Private Live
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <a href={`${webBase}/workspace`} target="_blank" rel="noreferrer">
            Open Public Demo Workspace
          </a>
          <a
            href={`${webBase}/private-workspace`}
            target="_blank"
            rel="noreferrer"
          >
            Open Private Workspace
          </a>
        </div>
      </section>

      <section
        style={{
          border: "1px solid #d6cebf",
          background: "#fffaf2",
          borderRadius: 12,
          padding: 18,
        }}
      >
        <h2>Admin Access</h2>
        <p>
          Super Admins can invite or update roles for other operators/viewers.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="email"
            placeholder="user@company.com"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            disabled={!canManageUsers}
          />
          <select
            value={newRole}
            onChange={(event) => setNewRole(event.target.value as AdminRole)}
            disabled={!canManageUsers}
          >
            <option value="viewer">viewer</option>
            <option value="operator">operator</option>
            <option value="super_admin">super_admin</option>
          </select>
          <button
            type="button"
            onClick={() => void addUser()}
            disabled={!canManageUsers || !newEmail.trim()}
          >
            Upsert User
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Email
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Role
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.email}>
                <td style={{ padding: "6px 0" }}>{user.email}</td>
                <td style={{ padding: "6px 0" }}>{user.role}</td>
                <td style={{ padding: "6px 0" }}>
                  {new Date(user.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p style={{ marginTop: 12 }}>{status}</p>
      <a href="/api/auth/signout">Sign out</a>
    </main>
  );
}
