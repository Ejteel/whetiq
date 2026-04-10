"use client";

import type { TimelineEntry } from "@mvp/core";
import type { CSSProperties, ReactElement } from "react";
import { useState } from "react";
import { tracksConfig } from "../../../config/tracks.config.js";

interface TimelineCardProps {
  entry: TimelineEntry;
  side: "left" | "right";
}

function formatDateRange(entry: TimelineEntry): string {
  const start = `${entry.startDate.month}/${entry.startDate.year}`;
  const end = entry.endDate
    ? `${entry.endDate.month}/${entry.endDate.year}`
    : "Present";
  return `${start} - ${end}`;
}

export function TimelineCard({
  entry,
  side,
}: TimelineCardProps): ReactElement | null {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!entry.isVisible) {
    return null;
  }

  return (
    <article
      className={`timeline-card timeline-card-${side} ${isExpanded ? "timeline-card-expanded" : ""}`}
      style={
        {
          "--timeline-track-color": tracksConfig[entry.track].colorToken,
        } as CSSProperties
      }
    >
      <button
        className="timeline-card-toggle"
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <div className="timeline-card-header">
          <p className="timeline-card-company">{entry.organization}</p>
          <p className="timeline-card-date">{formatDateRange(entry)}</p>
        </div>
        <div className="timeline-card-title-row">
          <h2 className="timeline-card-title">{entry.role}</h2>
          <span className="timeline-card-chevron" aria-hidden="true">
            {isExpanded ? "⌃" : "⌄"}
          </span>
        </div>
      </button>
      {isExpanded ? (
        <div className="timeline-card-body">
          <ul className="timeline-card-bullets">
            {entry.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <div className="timeline-card-tags">
            {entry.tags.map((tag) => (
              <span key={tag} className="timeline-card-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
