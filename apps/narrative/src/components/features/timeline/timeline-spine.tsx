"use client";

import type { NarrativeProfile } from "@mvp/core";
import type { ReactElement } from "react";
import { TimelineCard } from "./timeline-card";
import { YearMarker } from "./year-marker";

interface TimelineSpineProps {
  profile: NarrativeProfile;
  editMode: boolean;
  onSaveEntry: (entry: NarrativeProfile["timeline"][number]) => Promise<void>;
}

function getEntrySide(
  track: NarrativeProfile["timeline"][number]["track"],
): "left" | "right" {
  if (track === "education") {
    return "right";
  }

  return "left";
}

function getVisibleYears(profile: NarrativeProfile): number[] {
  const years = new Set<number>();
  for (const entry of profile.timeline) {
    if (entry.isVisible) {
      years.add(entry.startDate.year);
    }
  }

  return [...years].sort((left, right) => right - left);
}

export function TimelineSpine({
  profile,
  editMode,
  onSaveEntry,
}: TimelineSpineProps): ReactElement {
  const years = getVisibleYears(profile);

  return (
    <section
      className="timeline-section"
      aria-label="Career timeline"
      role="timeline"
    >
      <div className="timeline-marker-column">
        {years.map((year) => (
          <div key={year} className="timeline-year-anchor" id={`year-${year}`}>
            <YearMarker year={year} />
          </div>
        ))}
      </div>
      <div className="timeline-list">
        {profile.timeline.map((entry) => (
          <TimelineCard
            key={entry.id}
            entry={entry}
            side={getEntrySide(entry.track)}
            editMode={editMode}
            onSave={onSaveEntry}
          />
        ))}
      </div>
    </section>
  );
}
