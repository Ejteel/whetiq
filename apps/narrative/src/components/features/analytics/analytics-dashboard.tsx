"use client";

import type { AnalyticsSummary } from "../../../types/analytics.types";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

interface AnalyticsDashboardProps {
  slug: string;
  editMode: boolean;
}

const LOOKBACK_DAYS = 30;

function createDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - LOOKBACK_DAYS);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export function AnalyticsDashboard({
  slug,
  editMode,
}: AnalyticsDashboardProps): ReactElement | null {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect((): void => {
    if (!editMode) {
      return;
    }

    const { from, to } = createDateRange();

    async function loadSummary(): Promise<void> {
      setIsLoading(true);
      const response = await fetch(
        `/api/analytics/${slug}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );

      if (!response.ok) {
        setIsLoading(false);
        return;
      }

      const data = (await response.json()) as AnalyticsSummary;
      setSummary(data);
      setIsLoading(false);
    }

    void loadSummary();
  }, [editMode, slug]);

  if (!editMode) {
    return null;
  }

  return (
    <section className="analytics-dashboard">
      <div className="analytics-dashboard-header">
        <p className="parser-section-label">Analytics overview</p>
        <p className="analytics-dashboard-meta">Last {LOOKBACK_DAYS} days</p>
      </div>
      {isLoading ? (
        <div className="analytics-dashboard-grid" aria-busy="true">
          <div className="analytics-card analytics-card-skeleton" />
          <div className="analytics-card analytics-card-skeleton" />
          <div className="analytics-card analytics-card-skeleton" />
        </div>
      ) : summary ? (
        <div className="analytics-dashboard-grid">
          <article className="analytics-card">
            <p className="analytics-card-label">Sessions</p>
            <p className="analytics-card-value">{summary.totalSessions}</p>
            <p className="analytics-card-note">
              Latest visit: {summary.latestVisitAt ?? "No visits yet"}
            </p>
          </article>
          <article className="analytics-card">
            <p className="analytics-card-label">Device mix</p>
            <ul className="analytics-list">
              {Object.entries(summary.byDeviceType).map(
                ([deviceType, count]) => (
                  <li key={deviceType}>
                    <span>{deviceType}</span>
                    <strong>{count}</strong>
                  </li>
                ),
              )}
            </ul>
          </article>
          <article className="analytics-card">
            <p className="analytics-card-label">Top referrers</p>
            <ul className="analytics-list">
              {summary.byReferrer.length === 0 ? (
                <li>
                  <span>Direct / unknown</span>
                  <strong>0</strong>
                </li>
              ) : (
                summary.byReferrer.map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.sessions}</strong>
                  </li>
                ))
              )}
            </ul>
          </article>
        </div>
      ) : (
        <div className="analytics-dashboard-grid">
          <article className="analytics-card">
            <p className="analytics-card-label">Sessions</p>
            <p className="analytics-card-value">0</p>
            <p className="analytics-card-note">No analytics recorded yet.</p>
          </article>
        </div>
      )}
    </section>
  );
}
