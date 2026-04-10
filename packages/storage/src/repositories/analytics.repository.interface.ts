import type { AnalyticsEvent, AnalyticsSession } from "@mvp/core";

/**
 * Analytics repository contract for apps/narrative.
 */
export interface IAnalyticsRepository {
  createSession(session: AnalyticsSession): Promise<string>;
  recordEvents(sessionId: string, events: AnalyticsEvent[]): Promise<void>;
  getSessionsByProfile(
    profileId: string,
    from: Date,
    to: Date,
  ): Promise<AnalyticsSession[]>;
  getSessionsByProfileSlug(
    slug: string,
    from: Date,
    to: Date,
  ): Promise<AnalyticsSession[]>;
}
