"use client";

import { useEffect, useState } from "react";

type RuntimeMode = "demo" | "private_live";
type AdminRole = "viewer" | "operator" | "super_admin";

type UserRow = {
  email: string;
  role: AdminRole;
  updatedAt: string;
};

export default function InternalPage() {
  const [mode, setMode] = useState<RuntimeMode>("private_live");
  const [role, setRole] = useState<AdminRole | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("viewer");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void fetch("/api/internal/mode")
      .then((r) => r.json())
      .then((json) => {
        setMode(json.mode);
        setRole(json.role);
      });

    void fetch("/api/internal/users")
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((json) => setUsers(Array.isArray(json.users) ? json.users : []));
  }, []);

  async function updateMode(nextMode: RuntimeMode) {
    setStatus("Saving mode...");
    const response = await fetch("/api/internal/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId: "aggregator-web", mode: nextMode })
    });

    if (!response.ok) {
      setStatus("Mode update failed.");
      return;
    }
    setMode(nextMode);
    setStatus(`Mode set to ${nextMode}.`);
  }

  async function addUser() {
    setStatus("Updating user access...");
    const response = await fetch("/api/internal/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, role: newRole })
    });
    if (!response.ok) {
      setStatus("User update failed.");
      return;
    }
    const json = (await response.json()) as { users: UserRow[] };
    setUsers(json.users);
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
        Runtime mode controls apply to the private workspace experience. Public demo workspace always stays in demo mode.
      </p>

      <section style={{ border: "1px solid #d6cebf", background: "#fffaf2", borderRadius: 12, padding: 18, marginBottom: 16 }}>
        <h2>Aggregator Runtime Mode</h2>
        <p>Current mode: <strong>{mode}</strong></p>
        <p style={{ marginTop: 4, color: "#5c5546" }}>
          Affects: <code>/private-workspace</code>. Does not change: <code>/workspace</code>.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" disabled={!canOperate} onClick={() => void updateMode("demo")}>Set Demo</button>
          <button type="button" disabled={!canOperate} onClick={() => void updateMode("private_live")}>Set Private Live</button>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <a href={`${webBase}/workspace`} target="_blank" rel="noreferrer">Open Public Demo Workspace</a>
          <a href={`${webBase}/private-workspace`} target="_blank" rel="noreferrer">Open Private Workspace</a>
        </div>
      </section>

      <section style={{ border: "1px solid #d6cebf", background: "#fffaf2", borderRadius: 12, padding: 18 }}>
        <h2>Admin Access</h2>
        <p>Super Admins can invite or update roles for other operators/viewers.</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="email"
            placeholder="user@company.com"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            disabled={!canManageUsers}
          />
          <select value={newRole} onChange={(event) => setNewRole(event.target.value as AdminRole)} disabled={!canManageUsers}>
            <option value="viewer">viewer</option>
            <option value="operator">operator</option>
            <option value="super_admin">super_admin</option>
          </select>
          <button type="button" onClick={() => void addUser()} disabled={!canManageUsers || !newEmail.trim()}>
            Upsert User
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Email</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Role</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.email}>
                <td style={{ padding: "6px 0" }}>{user.email}</td>
                <td style={{ padding: "6px 0" }}>{user.role}</td>
                <td style={{ padding: "6px 0" }}>{new Date(user.updatedAt).toLocaleString()}</td>
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
