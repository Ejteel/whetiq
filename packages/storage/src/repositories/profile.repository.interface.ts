import type { NarrativeProfile } from "@mvp/core";

/**
 * Profile repository contract for apps/narrative.
 */
export interface IProfileRepository {
  getDraft(profileId: string): Promise<NarrativeProfile>;
  getPublished(profileId: string): Promise<NarrativeProfile>;
  getDraftBySlug(slug: string): Promise<NarrativeProfile>;
  getPublishedBySlug(slug: string): Promise<NarrativeProfile>;
  saveDraft(profileId: string, data: NarrativeProfile): Promise<void>;
  publish(profileId: string): Promise<void>;
}
