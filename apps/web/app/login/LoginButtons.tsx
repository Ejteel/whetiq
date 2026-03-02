"use client";

import { signIn } from "next-auth/react";

export function LoginButtons({ callbackUrl }: { callbackUrl: string }) {
  return (
    <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
      <button
        type="button"
        onClick={() => void signIn("github", { callbackUrl })}
        style={{
          display: "inline-block",
          textAlign: "left",
          border: "1px solid #c5bdaf",
          borderRadius: 12,
          padding: "10px 14px",
          background: "#fffdf8",
          color: "#262521",
          fontWeight: 600
        }}
      >
        Continue with GitHub
      </button>
      <button
        type="button"
        onClick={() => void signIn("google", { callbackUrl })}
        style={{
          display: "inline-block",
          textAlign: "left",
          border: "1px solid #c5bdaf",
          borderRadius: 12,
          padding: "10px 14px",
          background: "#fffdf8",
          color: "#262521",
          fontWeight: 600
        }}
      >
        Continue with Google
      </button>
    </div>
  );
}
