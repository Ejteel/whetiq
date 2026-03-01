import { readFile } from "node:fs/promises";
import { extname } from "node:path";

export interface ExtractionResult {
  extractedText: string;
  status: "complete" | "failed";
}

function isPlainTextExtension(filePath: string): boolean {
  return [".txt", ".md", ".json", ".csv", ".ts", ".js", ".py"].includes(extname(filePath).toLowerCase());
}

export async function extractTextFromAttachment(filePath: string): Promise<ExtractionResult> {
  try {
    if (!isPlainTextExtension(filePath)) {
      return {
        extractedText: "[Extraction placeholder for binary document formats in MVP scaffold]",
        status: "complete"
      };
    }

    const raw = await readFile(filePath, "utf8");
    return {
      extractedText: raw.slice(0, 40_000),
      status: "complete"
    };
  } catch (error) {
    return {
      extractedText: error instanceof Error ? error.message : "Extraction failed",
      status: "failed"
    };
  }
}
