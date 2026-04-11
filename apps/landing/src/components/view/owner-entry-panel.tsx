"use client";

import { getProviders, signIn } from "next-auth/react";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

type ProviderId = "github" | "google";
type ProviderState = Record<ProviderId, boolean>;

interface OwnerEntryPanelProps {
  callbackUrl: string;
}

const DEFAULT_PROVIDERS: ProviderState = {
  github: false,
  google: false,
};

export function OwnerEntryPanel({
  callbackUrl,
}: OwnerEntryPanelProps): ReactElement {
  const [providers, setProviders] = useState<ProviderState>(DEFAULT_PROVIDERS);

  useEffect((): (() => void) => {
    let active = true;

    void getProviders().then((data) => {
      if (!active) {
        return;
      }

      setProviders({
        github: Boolean(data?.github),
        google: Boolean(data?.google),
      });
    });

    return (): void => {
      active = false;
    };
  }, []);

  const hasAnyProvider = useMemo(
    () => providers.github || providers.google,
    [providers.github, providers.google],
  );

  return (
    <section className="owner-entry-panel" aria-label="Owner sign in">
      <p className="owner-entry-kicker">Owner access</p>
      <h2 className="owner-entry-title">Sign in to edit this landing hub</h2>
      <p className="owner-entry-copy">
        After authentication, this same page will enter draft edit mode
        automatically.
      </p>
      <div className="owner-entry-actions">
        {providers.github ? (
          <button
            className="landing-button-primary"
            type="button"
            onClick={(): void => {
              void signIn("github", { callbackUrl });
            }}
          >
            Continue with GitHub
          </button>
        ) : null}
        {providers.google ? (
          <button
            className="landing-button-ghost"
            type="button"
            onClick={(): void => {
              void signIn("google", { callbackUrl });
            }}
          >
            Continue with Google
          </button>
        ) : null}
      </div>
      {!hasAnyProvider ? (
        <p className="owner-entry-copy">
          No OAuth providers are configured for this deployment yet.
        </p>
      ) : null}
    </section>
  );
}
