"use client";

import { signIn } from "next-auth/react";

type LoginButtonsProps = {
  hasGitHub: boolean;
  hasGoogle: boolean;
};

export function LoginButtons({ hasGitHub, hasGoogle }: LoginButtonsProps) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {hasGitHub ? (
        <button
          type="button"
          onClick={() => void signIn("github", { callbackUrl: "/internal" })}
          style={{
            display: "inline-block",
            textAlign: "left",
            border: "1px solid #c5bdaf",
            borderRadius: 12,
            padding: "10px 14px",
            background: "#fffdf8",
            color: "#262521",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Continue with GitHub
        </button>
      ) : null}
      {hasGoogle ? (
        <button
          type="button"
          onClick={() => void signIn("google", { callbackUrl: "/internal" })}
          style={{
            display: "inline-block",
            textAlign: "left",
            border: "1px solid #c5bdaf",
            borderRadius: 12,
            padding: "10px 14px",
            background: "#fffdf8",
            color: "#262521",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Continue with Google
        </button>
      ) : null}
      {!hasGitHub && !hasGoogle ? (
        <p style={{ color: "#7d7565", margin: 0 }}>
          No OAuth providers configured. Set `AUTH_GITHUB_*` and/or `AUTH_GOOGLE_*` environment variables.
        </p>
      ) : null}
    </div>
  );
}
