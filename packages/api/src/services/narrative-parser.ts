import type { ParserResult } from "@mvp/core";

interface ParseNarrativeProfileDocumentInput {
  documentText: string;
  fileName: string;
  mimeType: string;
}

export async function parseNarrativeProfileDocument(
  input: ParseNarrativeProfileDocumentInput,
): Promise<ParserResult> {
  const lines = input.documentText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const [name = "Candidate Name", location = "Location TBD"] = lines;

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
      timeline: [],
    },
    unmatchedContent: lines.slice(2),
    confidenceByField: {
      name: "high",
      location: "medium",
    },
  };
}
