import type { ParserResult, TimelineEntry, TrackType } from "@mvp/core";

interface ParseNarrativeProfileDocumentInput {
  documentText: string;
  fileName: string;
  mimeType: string;
}

const TIMELINE_CHUNK_SIZE = 3;
const MAX_PARSED_TIMELINE_ENTRIES = 4;
const DEFAULT_START_YEAR = 2020;

function detectTrackType(value: string): TrackType {
  const normalizedValue = value.toLowerCase();

  if (
    normalizedValue.includes("army") ||
    normalizedValue.includes("navy") ||
    normalizedValue.includes("air force") ||
    normalizedValue.includes("marine")
  ) {
    return "military";
  }

  if (
    normalizedValue.includes("university") ||
    normalizedValue.includes("college") ||
    normalizedValue.includes("school") ||
    normalizedValue.includes("mba")
  ) {
    return "education";
  }

  return "work";
}

function chunkLines(lines: string[]): string[][] {
  const chunks: string[][] = [];

  for (let index = 0; index < lines.length; index += TIMELINE_CHUNK_SIZE) {
    chunks.push(lines.slice(index, index + TIMELINE_CHUNK_SIZE));
  }

  return chunks.slice(0, MAX_PARSED_TIMELINE_ENTRIES);
}

function buildTimelineEntry(chunk: string[], index: number): TimelineEntry {
  const [
    roleLine = `Imported role ${index + 1}`,
    organizationLine = "Organization TBD",
    bulletLine,
  ] = chunk;
  const track = detectTrackType(`${roleLine} ${organizationLine}`);

  return {
    id: crypto.randomUUID(),
    track,
    role: roleLine,
    organization: organizationLine,
    startDate: {
      month: 1,
      year: DEFAULT_START_YEAR + index,
    },
    endDate:
      index === 0 ? null : { month: 12, year: DEFAULT_START_YEAR + index },
    bullets: [bulletLine || organizationLine].slice(0, 4),
    tags: [track].slice(0, 5),
    isVisible: true,
  };
}

export async function parseNarrativeProfileDocument(
  input: ParseNarrativeProfileDocumentInput,
): Promise<ParserResult> {
  const lines = input.documentText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const [name = "Candidate Name", location = "Location TBD"] = lines;
  const detailLines = lines.slice(2);
  const chunks = chunkLines(detailLines);
  const parsedTimeline = chunks.map((chunk, index) =>
    buildTimelineEntry(chunk, index),
  );
  const matchedLineCount = chunks.length * TIMELINE_CHUNK_SIZE;

  return {
    profile: {
      id: crypto.randomUUID(),
      slug: "ethan",
      name,
      location,
      availability: "Open to discussion",
      identityStatements: [],
      summary: {
        fallback: `Imported from ${input.fileName} (${input.mimeType}).`,
        contextSummaries: [],
      },
      timeline: parsedTimeline,
    },
    unmatchedContent: detailLines.slice(matchedLineCount),
    confidenceByField: {
      name: "high",
      location: "medium",
      availability: "low",
      "summary.fallback": "medium",
      ...Object.fromEntries(
        parsedTimeline.map((_, index) => [`timeline.${index}`, "medium"]),
      ),
    },
  };
}
