import type { NarrativeProfile } from "@mvp/core";
import { ResourceNotFoundError } from "@mvp/core";
import type { IProfileRepository } from "@mvp/storage";
import {
  cloneNarrativeProfile,
  readNarrativeE2EState,
  writeNarrativeE2EState,
} from "../lib/e2e-state";

export class E2EProfileRepository implements IProfileRepository {
  async getDraft(profileId: string): Promise<NarrativeProfile> {
    const state = readNarrativeE2EState();
    if (state.narrative.draft.id !== profileId) {
      throw new ResourceNotFoundError("Profile draft", profileId);
    }

    return cloneNarrativeProfile(state.narrative.draft);
  }

  async getPublished(profileId: string): Promise<NarrativeProfile> {
    const state = readNarrativeE2EState();
    if (state.narrative.published.id !== profileId) {
      throw new ResourceNotFoundError("Published profile", profileId);
    }

    return cloneNarrativeProfile(state.narrative.published);
  }

  async getDraftBySlug(slug: string): Promise<NarrativeProfile> {
    const state = readNarrativeE2EState();
    if (state.narrative.draft.slug !== slug) {
      throw new ResourceNotFoundError("Profile draft", slug);
    }

    return cloneNarrativeProfile(state.narrative.draft);
  }

  async getPublishedBySlug(slug: string): Promise<NarrativeProfile> {
    const state = readNarrativeE2EState();
    if (state.narrative.published.slug !== slug) {
      throw new ResourceNotFoundError("Published profile", slug);
    }

    return cloneNarrativeProfile(state.narrative.published);
  }

  async saveDraft(profileId: string, data: NarrativeProfile): Promise<void> {
    const state = readNarrativeE2EState();
    if (state.narrative.draft.id !== profileId) {
      throw new ResourceNotFoundError("Profile draft", profileId);
    }

    state.narrative.draft = cloneNarrativeProfile(data);
    writeNarrativeE2EState(state);
  }

  async publish(profileId: string): Promise<void> {
    const state = readNarrativeE2EState();
    if (state.narrative.draft.id !== profileId) {
      throw new ResourceNotFoundError("Published profile", profileId);
    }

    state.narrative.published = cloneNarrativeProfile(state.narrative.draft);
    writeNarrativeE2EState(state);
  }
}
