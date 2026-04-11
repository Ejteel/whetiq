import type { LandingProfile } from "@mvp/core";
import type { LandingProfilePatchPayload } from "../types/landing.types";

interface LandingRepositoryLike {
  getPublished(): Promise<LandingProfile>;
  getDraft(): Promise<LandingProfile>;
  saveDraft(data: LandingProfile): Promise<void>;
  publish(): Promise<void>;
}

export class LandingService {
  constructor(private readonly repository: LandingRepositoryLike) {}

  async getPublished(): Promise<LandingProfile> {
    return this.repository.getPublished();
  }

  async getDraft(): Promise<LandingProfile> {
    return this.repository.getDraft();
  }

  async saveDraft(patch: LandingProfilePatchPayload): Promise<LandingProfile> {
    const current = await this.repository.getDraft();
    const nextProfile: LandingProfile = {
      ...current,
      ...patch,
      cards: patch.cards ?? current.cards,
    };
    await this.repository.saveDraft(nextProfile);
    return nextProfile;
  }

  async publish(): Promise<void> {
    await this.repository.publish();
  }
}
