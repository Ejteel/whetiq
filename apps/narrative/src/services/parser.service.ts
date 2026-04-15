import type { ParserResult } from "@mvp/core";
import { parseNarrativeProfileDocument } from "@mvp/api/services/narrative-parser";

export class ParserService {
  constructor(
    private readonly parseNarrativeProfile = parseNarrativeProfileDocument,
  ) {}

  async parseDocument(
    documentText: string,
    fileName: string,
    mimeType: string,
    documentBase64?: string,
  ): Promise<ParserResult> {
    return this.parseNarrativeProfile({
      documentText,
      documentBase64,
      fileName,
      mimeType,
    });
  }
}
