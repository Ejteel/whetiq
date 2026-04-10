import { generateTailoredNarrativeSummary } from "@mvp/api/services/narrative-tailoring";
import type { NarrativeProfile, TailoringContext } from "@mvp/core";

export class TailoringService {
  async tailorSummary(
    profile: NarrativeProfile,
    context: TailoringContext,
  ): Promise<string> {
    return generateTailoredNarrativeSummary(profile, context);
  }
}
