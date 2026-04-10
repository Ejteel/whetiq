import type { AnalyticsEvent, AnalyticsSession } from "@mvp/core";
import type { IAnalyticsRepository } from "@mvp/storage";
import {
  readNarrativeE2EState,
  toAnalyticsSession,
  writeNarrativeE2EState,
} from "../lib/e2e-state";

export class E2EAnalyticsRepository implements IAnalyticsRepository {
  async createSession(session: AnalyticsSession): Promise<string> {
    const state = readNarrativeE2EState();
    const sessionId = crypto.randomUUID();
    state.narrative.analyticsSessions.push({
      id: sessionId,
      profileId: session.profileId,
      referrer: session.referrer,
      contextToken: session.contextToken,
      deviceType: session.deviceType,
      detectedCompany: session.detectedCompany,
      createdAt: session.createdAt.toISOString(),
    });
    writeNarrativeE2EState(state);
    return sessionId;
  }

  async recordEvents(
    _sessionId: string,
    events: AnalyticsEvent[],
  ): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const state = readNarrativeE2EState();
    state.narrative.analyticsEvents.push(
      ...events.map((event) => ({
        id: crypto.randomUUID(),
        profileId: event.profileId,
        sessionId: event.sessionId,
        eventName: event.eventName,
        payload: event.payload,
        occurredAt: event.occurredAt.toISOString(),
        sequenceNumber: event.sequenceNumber,
      })),
    );
    writeNarrativeE2EState(state);
  }

  async getSessionsByProfile(
    profileId: string,
    from: Date,
    to: Date,
  ): Promise<AnalyticsSession[]> {
    const state = readNarrativeE2EState();
    return state.narrative.analyticsSessions
      .filter((session) => {
        const createdAt = new Date(session.createdAt);
        return (
          session.profileId === profileId &&
          createdAt >= from &&
          createdAt <= to
        );
      })
      .map(toAnalyticsSession);
  }

  async getSessionsByProfileSlug(
    slug: string,
    from: Date,
    to: Date,
  ): Promise<AnalyticsSession[]> {
    const state = readNarrativeE2EState();
    if (state.narrative.published.slug !== slug) {
      return [];
    }

    return this.getSessionsByProfile(state.narrative.published.id, from, to);
  }
}
