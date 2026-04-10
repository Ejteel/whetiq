import type { TrackType } from "@mvp/core";

export const tracksConfig: Record<
  TrackType,
  { label: string; colorToken: string }
> = {
  work: { label: "Work", colorToken: "var(--color-track-work)" },
  education: { label: "Education", colorToken: "var(--color-track-education)" },
  military: { label: "Military", colorToken: "var(--color-track-military)" },
  other: { label: "Other", colorToken: "var(--color-track-other)" },
};
