"use client";

import type { TimelineEntry } from "@mvp/core";
import type { CSSProperties, ReactElement } from "react";
import { useEffect, useState } from "react";
import { tracksConfig } from "../../../config/tracks.config";

interface TimelineCardProps {
  entry: TimelineEntry;
  side: "left" | "right";
  editMode: boolean;
  onSave: (entry: TimelineEntry) => Promise<void>;
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
  editMode,
  onSave,
}: TimelineCardProps): ReactElement | null {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftEntry, setDraftEntry] = useState(entry);

  useEffect((): void => {
    setDraftEntry(entry);
  }, [entry]);

  if (!draftEntry.isVisible) {
    return null;
  }

  async function saveEntry(nextEntry: TimelineEntry): Promise<void> {
    setDraftEntry(nextEntry);
    await onSave(nextEntry);
  }

  return (
    <article
      className={`timeline-card timeline-card-${side} ${isExpanded ? "timeline-card-expanded" : ""}`}
      style={
        {
          "--timeline-track-color": tracksConfig[draftEntry.track].colorToken,
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
          <p className="timeline-card-company">{draftEntry.organization}</p>
          <p className="timeline-card-date">{formatDateRange(draftEntry)}</p>
        </div>
        <div className="timeline-card-title-row">
          <h2 className="timeline-card-title">{draftEntry.role}</h2>
          <span className="timeline-card-chevron" aria-hidden="true">
            {isExpanded ? "⌃" : "⌄"}
          </span>
        </div>
      </button>
      {isExpanded ? (
        <div className="timeline-card-body">
          {editMode ? (
            <div className="timeline-editor">
              <label className="timeline-editor-field">
                <span>Role</span>
                <input
                  className="inline-input"
                  defaultValue={draftEntry.role}
                  maxLength={80}
                  onBlur={async (event): Promise<void> => {
                    await saveEntry({
                      ...draftEntry,
                      role: event.currentTarget.value.trim(),
                    });
                  }}
                />
              </label>
              <label className="timeline-editor-field">
                <span>Organization</span>
                <input
                  className="inline-input"
                  defaultValue={draftEntry.organization}
                  maxLength={80}
                  onBlur={async (event): Promise<void> => {
                    await saveEntry({
                      ...draftEntry,
                      organization: event.currentTarget.value.trim(),
                    });
                  }}
                />
              </label>
              <label className="timeline-editor-field">
                <span>Bullets</span>
                <textarea
                  className="inline-textarea timeline-editor-textarea"
                  defaultValue={draftEntry.bullets.join("\n")}
                  onBlur={async (event): Promise<void> => {
                    const bullets = event.currentTarget.value
                      .split("\n")
                      .map((bullet) => bullet.trim())
                      .filter(Boolean)
                      .slice(0, 4);
                    await saveEntry({ ...draftEntry, bullets });
                  }}
                />
              </label>
              <label className="timeline-editor-field">
                <span>Tags</span>
                <input
                  className="inline-input"
                  defaultValue={draftEntry.tags.join(", ")}
                  onBlur={async (event): Promise<void> => {
                    const tags = event.currentTarget.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                      .slice(0, 5);
                    await saveEntry({ ...draftEntry, tags });
                  }}
                />
              </label>
              <label className="timeline-editor-checkbox">
                <input
                  checked={draftEntry.isVisible}
                  type="checkbox"
                  onChange={async (event): Promise<void> => {
                    await saveEntry({
                      ...draftEntry,
                      isVisible: event.currentTarget.checked,
                    });
                  }}
                />
                <span>Visible to visitors</span>
              </label>
            </div>
          ) : (
            <ul className="timeline-card-bullets">
              {draftEntry.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
          <div className="timeline-card-tags">
            {draftEntry.tags.map((tag) => (
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
