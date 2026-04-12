"use client";

import type { TimelineEntry, TrackType } from "@mvp/core";
import type { CSSProperties, ReactElement } from "react";
import { useEffect, useState } from "react";
import { tracksConfig } from "../../../config/tracks.config";

interface TimelineCardProps {
  entry: TimelineEntry;
  side: "left" | "right";
  topPx?: number;
  heightPx?: number;
  editMode: boolean;
  onSave: (entry: TimelineEntry) => Promise<void>;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const TRACK_OPTIONS: { value: TrackType; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "education", label: "Education" },
  { value: "military", label: "Military" },
  { value: "other", label: "Other" },
];

function formatDateRange(entry: TimelineEntry): string {
  const start = `${MONTHS[entry.startDate.month - 1]} ${entry.startDate.year}`;
  const end = entry.endDate
    ? `${MONTHS[entry.endDate.month - 1]} ${entry.endDate.year}`
    : "Present";
  return `${start} – ${end}`;
}

function ChevronIcon({ expanded }: { expanded: boolean }): ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="timeline-card-chevron"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 16 16"
      width="16"
      style={{
        transform: expanded ? "rotate(180deg)" : "none",
        transition: "transform 150ms ease",
      }}
    >
      <polyline points="4 6 8 10 12 6" />
    </svg>
  );
}

export function TimelineCard({
  entry,
  side,
  topPx,
  heightPx,
  editMode,
  onSave,
}: TimelineCardProps): ReactElement | null {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftEntry, setDraftEntry] = useState(entry);
  const [expandedAt, setExpandedAt] = useState<number | null>(null);
  const [isPresent, setIsPresent] = useState(entry.endDate === null);

  useEffect((): void => {
    setDraftEntry(entry);
    setIsPresent(entry.endDate === null);
  }, [entry]);

  if (!draftEntry.isVisible && !editMode) {
    return null;
  }

  async function saveEntry(nextEntry: TimelineEntry): Promise<void> {
    setDraftEntry(nextEntry);
    await onSave(nextEntry);
  }

  function toggleExpandedState(): void {
    if (isExpanded) {
      window.dispatchEvent(
        new CustomEvent("card_collapse", {
          detail: {
            card_id: draftEntry.id,
            time_expanded_ms: expandedAt ? Date.now() - expandedAt : 0,
          },
        }),
      );
      setExpandedAt(null);
      setIsExpanded(false);
      return;
    }

    const now = Date.now();
    setExpandedAt(now);
    window.dispatchEvent(
      new CustomEvent("card_expand", {
        detail: {
          card_id: draftEntry.id,
          role: draftEntry.role,
          company: draftEntry.organization,
          track: draftEntry.track,
          timestamp: new Date(now).toISOString(),
        },
      }),
    );
    setIsExpanded(true);
  }

  const isHidden = !draftEntry.isVisible;
  const hasLayout = topPx !== undefined && heightPx !== undefined;

  return (
    <article
      className={`timeline-card timeline-card-${side}${isHidden ? " timeline-card-hidden" : ""}`}
      data-card-id={draftEntry.id}
      style={
        {
          "--timeline-track-color": tracksConfig[draftEntry.track].colorToken,
          position: hasLayout ? "absolute" : "relative",
          top: hasLayout ? topPx : undefined,
          minHeight: hasLayout ? heightPx : undefined,
          width: "100%",
          zIndex: isExpanded ? 10 : 1,
        } as CSSProperties
      }
    >
      <button
        className="timeline-card-toggle"
        type="button"
        aria-expanded={isExpanded}
        onClick={toggleExpandedState}
      >
        <div className="timeline-card-header">
          <p className="timeline-card-company">
            {draftEntry.organization || "—"}
            {isHidden && editMode ? (
              <span className="timeline-card-hidden-badge"> · Hidden</span>
            ) : null}
          </p>
          <p className="timeline-card-date">{formatDateRange(draftEntry)}</p>
        </div>
        <div className="timeline-card-title-row">
          <h2 className="timeline-card-title">
            {draftEntry.role || "Untitled entry"}
          </h2>
          <ChevronIcon expanded={isExpanded} />
        </div>
      </button>
      {isExpanded ? (
        <div className="timeline-card-body">
          {editMode ? (
            <div className="timeline-editor">
              <label className="timeline-editor-field">
                <span>Track</span>
                <select
                  className="inline-input"
                  value={draftEntry.track}
                  onChange={async (event): Promise<void> => {
                    const track = event.currentTarget.value as TrackType;
                    await saveEntry({ ...draftEntry, track });
                  }}
                >
                  {TRACK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
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
              <div className="timeline-editor-field">
                <span>Start date</span>
                <div className="timeline-date-row">
                  <select
                    className="inline-input timeline-date-month"
                    value={draftEntry.startDate.month}
                    onChange={async (event): Promise<void> => {
                      const month = Number(event.currentTarget.value);
                      await saveEntry({
                        ...draftEntry,
                        startDate: { ...draftEntry.startDate, month },
                      });
                    }}
                  >
                    {MONTHS.map((label, index) => (
                      <option key={label} value={index + 1}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    className="inline-input timeline-date-year"
                    type="number"
                    defaultValue={draftEntry.startDate.year}
                    min={1950}
                    max={new Date().getFullYear() + 1}
                    onBlur={async (event): Promise<void> => {
                      const year = Number(event.currentTarget.value);
                      if (year > 1950 && year <= new Date().getFullYear() + 1) {
                        await saveEntry({
                          ...draftEntry,
                          startDate: { ...draftEntry.startDate, year },
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="timeline-editor-field">
                <span>End date</span>
                <label className="timeline-editor-checkbox">
                  <input
                    type="checkbox"
                    checked={isPresent}
                    onChange={async (event): Promise<void> => {
                      const checked = event.currentTarget.checked;
                      setIsPresent(checked);
                      const endDate = checked
                        ? null
                        : {
                            month: new Date().getMonth() + 1,
                            year: new Date().getFullYear(),
                          };
                      await saveEntry({ ...draftEntry, endDate });
                    }}
                  />
                  <span>Present / ongoing</span>
                </label>
                {!isPresent ? (
                  <div className="timeline-date-row">
                    <select
                      className="inline-input timeline-date-month"
                      value={
                        draftEntry.endDate?.month ?? new Date().getMonth() + 1
                      }
                      onChange={async (event): Promise<void> => {
                        const month = Number(event.currentTarget.value);
                        await saveEntry({
                          ...draftEntry,
                          endDate: {
                            month,
                            year:
                              draftEntry.endDate?.year ??
                              new Date().getFullYear(),
                          },
                        });
                      }}
                    >
                      {MONTHS.map((label, index) => (
                        <option key={label} value={index + 1}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      className="inline-input timeline-date-year"
                      type="number"
                      defaultValue={
                        draftEntry.endDate?.year ?? new Date().getFullYear()
                      }
                      min={1950}
                      max={new Date().getFullYear() + 1}
                      onBlur={async (event): Promise<void> => {
                        const year = Number(event.currentTarget.value);
                        if (
                          year > 1950 &&
                          year <= new Date().getFullYear() + 1
                        ) {
                          await saveEntry({
                            ...draftEntry,
                            endDate: {
                              month: draftEntry.endDate?.month ?? 1,
                              year,
                            },
                          });
                        }
                      }}
                    />
                  </div>
                ) : null}
              </div>
              <label className="timeline-editor-field">
                <span>Bullets (one per line, max 4)</span>
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
                <span>Tags (comma-separated, max 5)</span>
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
