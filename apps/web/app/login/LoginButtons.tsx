"use client";

import { useEffect, useMemo, useState } from "react";
import { getProviders, signIn } from "next-auth/react";

type ProviderId = "github" | "google";

type ProviderState = Record<ProviderId, boolean>;

const DEFAULT_PROVIDERS: ProviderState = {
  github: false,
  google: false
};

export function LoginButtons({ callbackUrl }: { callbackUrl: string }) {
  const [providers, setProviders] = useState<ProviderState>(DEFAULT_PROVIDERS);

  useEffect(() => {
    let active = true;
    void getProviders().then((data) => {
      if (!active) {
        return;
      }
      setProviders({
        github: Boolean(data?.github),
        google: Boolean(data?.google)
      });
    });

    return () => {
      active = false;
    };
  }, []);

  const hasAnyProvider = useMemo(() => providers.github || providers.google, [providers.github, providers.google]);

  return (
    <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
      {providers.github ? (
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
      ) : null}
      {providers.google ? (
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
      ) : null}
      {!hasAnyProvider ? (
        <p style={{ color: "#7d7565", margin: 0 }}>
          No OAuth providers configured for this deployment. Set `AUTH_GITHUB_*` and/or `AUTH_GOOGLE_*`.
        </p>
      ) : null}
    </div>
  );
}
