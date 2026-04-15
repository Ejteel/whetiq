import type { ParserResult, TimelineEntry, TrackType } from "@mvp/core";

interface ParseNarrativeProfileDocumentInput {
  documentText: string;
  documentBase64?: string;
  fileName: string;
  mimeType: string;
}

// ─── Claude response schema ────────────────────────────────────────────────

interface ParsedDate {
  month: number;
  year: number;
}

interface ParsedEntry {
  role: string;
  organization: string;
  track: TrackType;
  startDate: ParsedDate;
  endDate: ParsedDate | null;
  bullets: string[];
  tags: string[];
  confidence: "high" | "medium" | "low";
}

interface ClaudeParserResponse {
  name: string;
  nameConfidence: "high" | "medium" | "low";
  location: string;
  locationConfidence: "high" | "medium" | "low";
  availability: string;
  summary: string;
  summaryConfidence: "high" | "medium" | "low";
  timeline: ParsedEntry[];
  unmatchedContent: string[];
}

// ─── System prompt ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a precise resume parser. Extract structured career data from the provided resume text and return ONLY valid JSON — no commentary, no markdown fences.

Return exactly this JSON shape:
{
  "name": "Full Name",
  "nameConfidence": "high" | "medium" | "low",
  "location": "City, ST or empty string",
  "locationConfidence": "high" | "medium" | "low",
  "availability": "A short sentence describing what the person is open to, inferred from their career level and trajectory",
  "summary": "The verbatim or lightly cleaned text from the resume's summary/objective section",
  "summaryConfidence": "high" | "medium" | "low",
  "timeline": [
    {
      "role": "Job title or degree name",
      "organization": "Employer or school name",
      "track": "work" | "education" | "military" | "other",
      "startDate": { "month": 1-12, "year": YYYY },
      "endDate": { "month": 1-12, "year": YYYY } | null,
      "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
      "tags": ["tag1", "tag2", "tag3"],
      "confidence": "high" | "medium" | "low"
    }
  ],
  "unmatchedContent": ["any resume content that doesn't fit the above fields"]
}

Rules:
- Parse ALL experience, education, and military entries — one entry per role/degree, not per employer.
- For date ranges like "2020–2024": startDate month=1, endDate month=12 of the end year. If the end year is the current year or future, set endDate to null (treat as ongoing).
- The current year is ${new Date().getFullYear()}.
- For education: if only a graduation year is listed, set endDate to { month: 5, year: YYYY } and infer a plausible start year (typically 2 years prior for MBA, 4 years for BS).
- track values: "work" for jobs, "education" for degrees/courses, "military" for military service, "other" for everything else.
- bullets: max 4, verbatim from resume if present, otherwise empty array.
- tags: 2-5 short keyword tags derived from the role/bullets (e.g. "product", "engineering", "leadership").
- confidence is "high" if dates/title/org are unambiguous, "medium" if inferred, "low" if guessed.
- unmatchedContent: content that doesn't belong to any specific entry (e.g. certifications section, additional interests).
- Return ONLY the JSON object, nothing else.`;

// ─── Claude API call ───────────────────────────────────────────────────────

async function callClaudeParser(
  resumeText: string,
  documentBase64?: string,
): Promise<ClaudeParserResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to apps/narrative/.env.local.",
    );
  }

  // For PDFs, use Anthropic's native document block (preserves layout/structure).
  // For plain text, send inline as a text message.
  const userContent: unknown = documentBase64
    ? [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: documentBase64,
          },
        },
        { type: "text", text: "Parse this resume following the schema." },
      ]
    : `Parse this resume:\n\n${resumeText}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const text = data.content.find((block) => block.type === "text")?.text ?? "";

  // Strip any accidental markdown fences
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned) as ClaudeParserResponse;
}

// ─── Map Claude response → ParserResult ───────────────────────────────────

function mapToParserResult(parsed: ClaudeParserResponse): ParserResult {
  const timeline: TimelineEntry[] = parsed.timeline.map((entry) => ({
    id: crypto.randomUUID(),
    track: entry.track,
    role: entry.role,
    organization: entry.organization,
    startDate: entry.startDate,
    endDate: entry.endDate,
    bullets: entry.bullets.slice(0, 4),
    tags: entry.tags.slice(0, 5),
    isVisible: true,
  }));

  const confidenceByField: Record<string, "high" | "medium" | "low"> = {
    name: parsed.nameConfidence,
    location: parsed.locationConfidence,
    availability: "medium",
    "summary.fallback": parsed.summaryConfidence,
  };

  parsed.timeline.forEach((entry, index) => {
    confidenceByField[`timeline.${index}`] = entry.confidence;
  });

  return {
    profile: {
      id: crypto.randomUUID(),
      slug: "ethan",
      name: parsed.name,
      location: parsed.location,
      availability: parsed.availability,
      identityStatements: [],
      summary: {
        fallback: parsed.summary,
        contextSummaries: [],
      },
      timeline,
    },
    unmatchedContent: parsed.unmatchedContent,
    confidenceByField,
  };
}

// ─── Fallback: naive stub when no API key ─────────────────────────────────

function naiveFallbackParse(
  documentText: string,
  fileName: string,
): ParserResult {
  const lines = documentText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const [name = "Candidate Name", location = ""] = lines;

  return {
    profile: {
      id: crypto.randomUUID(),
      slug: "ethan",
      name,
      location,
      availability: "Open to discussion",
      identityStatements: [],
      summary: {
        fallback: `Imported from ${fileName}. Add ANTHROPIC_API_KEY to .env.local for intelligent parsing.`,
        contextSummaries: [],
      },
      timeline: [],
    },
    unmatchedContent: lines.slice(2),
    confidenceByField: {
      name: "low",
      location: "low",
      availability: "low",
      "summary.fallback": "low",
    },
  };
}

// ─── Public entry point ────────────────────────────────────────────────────

export async function parseNarrativeProfileDocument(
  input: ParseNarrativeProfileDocumentInput,
): Promise<ParserResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return naiveFallbackParse(input.documentText, input.fileName);
  }

  const parsed = await callClaudeParser(input.documentText, input.documentBase64);
  return mapToParserResult(parsed);
}
