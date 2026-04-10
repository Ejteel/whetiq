import type { NarrativeProfile } from "@mvp/core";
import type { IProfileRepository } from "@mvp/storage";
import type { ProfilePatchPayload } from "../types/profile.types";

export class ProfileService {
  constructor(private readonly repository: IProfileRepository) {}

  async getPublishedBySlug(slug: string): Promise<NarrativeProfile> {
    return this.repository.getPublishedBySlug(slug);
  }

  async getDraftBySlug(slug: string): Promise<NarrativeProfile> {
    return this.repository.getDraftBySlug(slug);
  }

  async saveDraft(
    slug: string,
    patch: ProfilePatchPayload,
  ): Promise<NarrativeProfile> {
    const current = await this.repository.getDraftBySlug(slug);
    const nextProfile = this.#mergeDraft(current, patch);
    await this.repository.saveDraft(current.id, nextProfile);
    return nextProfile;
  }

  #mergeDraft(
    current: NarrativeProfile,
    patch: ProfilePatchPayload,
  ): NarrativeProfile {
    return {
      ...current,
      ...patch,
      identityStatements:
        patch.identityStatements ?? current.identityStatements,
      summary: patch.summary
        ? {
            ...current.summary,
            ...patch.summary,
            contextSummaries:
              patch.summary.contextSummaries ??
              current.summary.contextSummaries,
          }
        : current.summary,
      timeline: patch.timeline ?? current.timeline,
    };
  }
}
