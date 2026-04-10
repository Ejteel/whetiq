"use client";

import type { NarrativeProfile } from "@mvp/core";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { detectContextLabel } from "../../../lib/context-detector.js";
import { decodeContextToken } from "../../../lib/token-decoder.js";

interface AISummaryPanelProps {
  profile: NarrativeProfile;
  initialContextToken: string | null;
  editMode: boolean;
}

interface TailoringResponse {
  summary: string;
}

function getReferrerContext(referrer: string): { company?: string } | null {
  if (referrer.includes("linkedin.com")) {
    return { company: "LinkedIn" };
  }

  if (referrer.includes("greenhouse.io")) {
    return { company: "Greenhouse" };
  }

  if (referrer.includes("lever.co")) {
    return { company: "Lever" };
  }

  if (referrer.includes("workday.com")) {
    return { company: "Workday" };
  }

  return null;
}

export function AISummaryPanel({
  profile,
  initialContextToken,
  editMode,
}: AISummaryPanelProps): ReactElement {
  const [summary, setSummary] = useState(profile.summary.fallback);
  const [contextLabel, setContextLabel] = useState(
    detectContextLabel(initialContextToken),
  );
  const [isLoading, setIsLoading] = useState(Boolean(initialContextToken));

  useEffect((): (() => void) => {
    const contextToken = decodeContextToken(initialContextToken);
    const referrer = document.referrer || null;
    const fallbackTimer = window.setTimeout(() => {
      setIsLoading(false);
      setSummary(profile.summary.fallback);
    }, 1_500);

    async function tailorSummary(): Promise<void> {
      const referrerContext = referrer ? getReferrerContext(referrer) : null;
      if (!contextToken && !referrerContext) {
        setContextLabel(detectContextLabel(contextToken, referrer));
        setIsLoading(false);
        window.clearTimeout(fallbackTimer);
        return;
      }

      setContextLabel(detectContextLabel(contextToken, referrer));
      setIsLoading(true);

      const response = await fetch("/api/tailoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          context: {
            token: contextToken ?? undefined,
            company: referrerContext?.company,
            priorities: [],
          },
        }),
      });

      if (!response.ok) {
        setSummary(profile.summary.fallback);
        setIsLoading(false);
        window.clearTimeout(fallbackTimer);
        return;
      }

      const data = (await response.json()) as TailoringResponse;
      setSummary(data.summary);
      setIsLoading(false);
      window.clearTimeout(fallbackTimer);
    }

    void tailorSummary();
    return (): void => window.clearTimeout(fallbackTimer);
  }, [initialContextToken, profile]);

  return (
    <aside className="ai-summary-panel" aria-busy={isLoading}>
      <div className="ai-summary-header">
        <p className="ai-summary-label">{contextLabel}</p>
        {editMode ? (
          <button
            className="icon-button"
            type="button"
            aria-label="Regenerate tailored summary"
          >
            ↻
          </button>
        ) : null}
      </div>
      {isLoading ? (
        <div className="ai-summary-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ) : (
        <p className="ai-summary-text">{summary}</p>
      )}
    </aside>
  );
}
