import type { ParserResult } from "@mvp/core";
import { parseNarrativeProfileDocument } from "../../../../packages/api/dist/services/narrative-parser.js";

export class ParserService {
  constructor(
    private readonly parseNarrativeProfile = parseNarrativeProfileDocument,
  ) {}

  async parseDocument(
    documentText: string,
    fileName: string,
    mimeType: string,
  ): Promise<ParserResult> {
    return this.parseNarrativeProfile({ documentText, fileName, mimeType });
  }
}
