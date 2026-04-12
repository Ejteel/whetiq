import type { MonthYear, TimelineEntry } from "@mvp/core";

export const PX_PER_MONTH = 9; // 108px per year
export const CARD_MIN_HEIGHT_PX = 60;
const TOP_PAD_MONTHS = 3; // breathing room above the newest entry

export interface CardLayout {
  topPx: number;
  heightPx: number;
}

export interface YearMarkerLayout {
  year: number;
  topPx: number;
}

export interface TimelineLayout {
  totalHeightPx: number;
  cards: Partial<Record<string, CardLayout>>;
  yearMarkers: YearMarkerLayout[];
}

function toMonthIndex(d: MonthYear): number {
  return d.year * 12 + (d.month - 1);
}

export function computeTimelineLayout(
  entries: TimelineEntry[],
  today: MonthYear,
): TimelineLayout {
  if (entries.length === 0) {
    return { totalHeightPx: 200, cards: {}, yearMarkers: [] };
  }

  const todayIdx = toMonthIndex(today);
  const maxStart = Math.max(...entries.map((e) => toMonthIndex(e.startDate)));
  // originTop defines y=0 on the canvas (3 months of breathing room above newest)
  const originTop = maxStart + TOP_PAD_MONTHS;

  const cards: Record<string, CardLayout> = {};
  let maxBottom = 0;

  for (const entry of entries) {
    const startIdx = toMonthIndex(entry.startDate);
    const endIdx = entry.endDate ? toMonthIndex(entry.endDate) : todayIdx;
    const durationMonths = Math.max(endIdx - startIdx, 1);

    const topPx = (originTop - startIdx) * PX_PER_MONTH;
    const heightPx = Math.max(
      durationMonths * PX_PER_MONTH,
      CARD_MIN_HEIGHT_PX,
    );

    cards[entry.id] = { topPx, heightPx };
    maxBottom = Math.max(maxBottom, topPx + heightPx);
  }

  const totalHeightPx = maxBottom + TOP_PAD_MONTHS * PX_PER_MONTH;

  // Year marker: one per unique start year, at the y-position of January 1 of that year
  const years = [...new Set(entries.map((e) => e.startDate.year))].sort(
    (a, b) => b - a,
  );
  const yearMarkers: YearMarkerLayout[] = years.map((year) => ({
    year,
    topPx: (originTop - year * 12) * PX_PER_MONTH,
  }));

  return { totalHeightPx, cards, yearMarkers };
}
