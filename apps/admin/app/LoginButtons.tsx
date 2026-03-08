"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";

type ProviderId = "github" | "google";

type ProviderState = {
  github: boolean;
  google: boolean;
};

export function LoginButtons() {
  const [providers, setProviders] = useState<ProviderState>({ github: false, google: false });

  useEffect(() => {
    let active = true;
    void getProviders().then((data) => {
      if (!active || !data) {
        return;
      }
      setProviders({
        github: Boolean(data.github),
        google: Boolean(data.google)
      });
    });

    return () => {
      active = false;
    };
  }, []);

  const visible = (id: ProviderId) => providers[id];

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {visible("github") ? (
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
      {visible("google") ? (
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
      {!visible("github") && !visible("google") ? (
        <p style={{ color: "#7d7565", margin: 0 }}>
          No OAuth providers configured. Set `AUTH_GITHUB_*` and/or `AUTH_GOOGLE_*` environment variables.
        </p>
      ) : null}
    </div>
  );
}
