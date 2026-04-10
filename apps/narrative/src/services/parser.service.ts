import type { ParserResult } from "@mvp/core";
import { parseNarrativeProfileDocument } from "@mvp/api";

export class ParserService {
  async parseDocument(
    documentText: string,
    fileName: string,
    mimeType: string,
  ): Promise<ParserResult> {
    return parseNarrativeProfileDocument({ documentText, fileName, mimeType });
  }
}
