"use client";

import type { NarrativeProfile, TimelineEntry } from "@mvp/core";
import type { ReactElement } from "react";
import { TimelineCard } from "./timeline-card";
import { YearMarker } from "./year-marker";

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

function getDisplayYears(
  profile: NarrativeProfile,
  editMode: boolean,
): number[] {
  const years = new Set<number>();
  for (const entry of profile.timeline) {
    if (editMode || entry.isVisible) {
      years.add(entry.startDate.year);
    }
  }

  return [...years].sort((left, right) => right - left);
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
  const years = getDisplayYears(profile, editMode);
  const isEmpty = profile.timeline.length === 0;

  return (
    <section
      className="timeline-section"
      aria-label="Career timeline"
      data-section-id="timeline"
      role="region"
    >
      {isEmpty && editMode ? (
        <EmptyTimelineState onAddEntry={onAddEntry} />
      ) : (
        <>
          <div className="timeline-marker-column">
            {years.map((year) => (
              <div
                key={year}
                className="timeline-year-anchor"
                id={`year-${year}`}
              >
                <YearMarker year={year} />
              </div>
            ))}
          </div>
          <div className="timeline-list">
            {profile.timeline.map((entry: TimelineEntry) => (
              <TimelineCard
                key={entry.id}
                entry={entry}
                side={getEntrySide(entry.track)}
                editMode={editMode}
                onSave={onSaveEntry}
              />
            ))}
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
          </div>
        </>
      )}
    </section>
  );
}
