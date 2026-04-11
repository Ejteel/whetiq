import type { LandingProfile } from "@mvp/core";
import {
  cloneLandingProfile,
  readLandingE2EState,
  writeLandingE2EState,
} from "../lib/e2e-state";

export class E2ELandingRepository {
  async getDraft(): Promise<LandingProfile> {
    return cloneLandingProfile(readLandingE2EState().landing.draft);
  }

  async getPublished(): Promise<LandingProfile> {
    return cloneLandingProfile(readLandingE2EState().landing.published);
  }

  async saveDraft(data: LandingProfile): Promise<void> {
    const state = readLandingE2EState();
    state.landing.draft = cloneLandingProfile(data);
    writeLandingE2EState(state);
  }

  async publish(): Promise<void> {
    const state = readLandingE2EState();
    state.landing.published = cloneLandingProfile(state.landing.draft);
    writeLandingE2EState(state);
  }
}
