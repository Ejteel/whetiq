"use client";

import type { NarrativeProfile, TimelineEntry } from "@mvp/core";
import type { ReactElement } from "react";
import { TimelineCard } from "./timeline-card";
import { computeTimelineLayout } from "./timeline-layout";

interface TimelineSpineProps {
  profile: NarrativeProfile;
  editMode: boolean;
  onSaveEntry: (entry: NarrativeProfile["timeline"][number]) => Promise<void>;
  onAddEntry: () => Promise<void>;
}

function getEntrySide(
  track: NarrativeProfile["timeline"][number]["track"],
): "left" | "right" {
  if (track === "education") {
    return "right";
  }

  return "left";
}

function EmptyTimelineState({
  onAddEntry,
}: {
  onAddEntry: () => Promise<void>;
}): ReactElement {
  return (
    <div className="timeline-empty-state">
      <p className="timeline-empty-title">No timeline entries yet</p>
      <p className="timeline-empty-copy">
        Import your resume to populate the timeline automatically, or add
        entries manually one at a time.
      </p>
      <button
        className="ghost-button"
        type="button"
        onClick={() => void onAddEntry()}
      >
        + Add first entry
      </button>
    </div>
  );
}

export function TimelineSpine({
  profile,
  editMode,
  onSaveEntry,
  onAddEntry,
}: TimelineSpineProps): ReactElement {
  const isEmpty = profile.timeline.length === 0;

  if (isEmpty && editMode) {
    return (
      <section
        className="timeline-section"
        aria-label="Career timeline"
        data-section-id="timeline"
        role="region"
      >
        <EmptyTimelineState onAddEntry={onAddEntry} />
      </section>
    );
  }

  // Sort all visible entries by startDate descending (newest first = top of canvas)
  const sorted = [...profile.timeline]
    .filter((e) => editMode || e.isVisible)
    .sort((a, b) => {
      const aMs = a.startDate.year * 12 + a.startDate.month;
      const bMs = b.startDate.year * 12 + b.startDate.month;
      return bMs - aMs;
    });

  const leftEntries = sorted.filter((e) => getEntrySide(e.track) === "left");
  const rightEntries = sorted.filter((e) => getEntrySide(e.track) === "right");

  const today = {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  };
  const layout = computeTimelineLayout(sorted, today);

  return (
    <>
      <section
        className="timeline-section"
        aria-label="Career timeline"
        data-section-id="timeline"
        role="region"
      >
        {/* Left column: work, military, other */}
        <div
          className="timeline-list-left"
          style={{ height: layout.totalHeightPx }}
        >
          {leftEntries.map((entry: TimelineEntry) => (
            <TimelineCard
              key={entry.id}
              entry={entry}
              side="left"
              topPx={layout.cards[entry.id]?.topPx}
              heightPx={layout.cards[entry.id]?.heightPx}
              editMode={editMode}
              onSave={onSaveEntry}
            />
          ))}
        </div>

        {/* Center column: vertical spine + year markers */}
        <div
          className="timeline-marker-column"
          style={{ height: layout.totalHeightPx }}
        >
          {layout.yearMarkers.map(({ year, topPx }) => (
            <div
              key={year}
              id={`year-${year}`}
              className="timeline-year-marker"
              style={{ top: topPx }}
            >
              {year}
            </div>
          ))}
        </div>

        {/* Right column: education */}
        <div
          className="timeline-list-right"
          style={{ height: layout.totalHeightPx }}
        >
          {rightEntries.map((entry: TimelineEntry) => (
            <TimelineCard
              key={entry.id}
              entry={entry}
              side="right"
              topPx={layout.cards[entry.id]?.topPx}
              heightPx={layout.cards[entry.id]?.heightPx}
              editMode={editMode}
              onSave={onSaveEntry}
            />
          ))}
        </div>
      </section>

      {editMode ? (
        <div className="timeline-add-entry">
          <button
            className="ghost-button"
            type="button"
            onClick={() => void onAddEntry()}
          >
            + Add timeline entry
          </button>
        </div>
      ) : null}
    </>
  );
}
