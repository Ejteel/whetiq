import type { ReactElement } from "react";

interface YearMarkerProps {
  year: number;
}

export function YearMarker({ year }: YearMarkerProps): ReactElement {
  return (
    <a className="year-marker" href={`#year-${year}`}>
      {year}
    </a>
  );
}
