import { generateTailoredNarrativeSummary } from "../../../../packages/api/dist/services/narrative-tailoring.js";
import type { NarrativeProfile, TailoringContext } from "@mvp/core";

export class TailoringService {
  constructor(
    private readonly tailorNarrativeSummary = generateTailoredNarrativeSummary,
  ) {}

  async tailorSummary(
    profile: NarrativeProfile,
    context: TailoringContext,
  ): Promise<string> {
    return this.tailorNarrativeSummary(profile, context);
  }
}
