import type { AnalyticsBatchInput } from "../types/analytics.types.js";
import type { AnalyticsSession } from "@mvp/core";
import type { IAnalyticsRepository } from "@mvp/storage";

export class AnalyticsService {
  constructor(private readonly repository: IAnalyticsRepository) {}

  async recordBatch(
    input: AnalyticsBatchInput,
  ): Promise<{ sessionId: string }> {
    const sessionId =
      input.sessionId ??
      (await this.repository.createSession({
        profileId: input.profileId,
        referrer: input.referrer ?? null,
        contextToken: input.contextToken ?? null,
        deviceType: input.deviceType,
        detectedCompany: null,
        createdAt: new Date(),
      }));

    await this.repository.recordEvents(
      sessionId,
      input.events.map((event, index) => ({
        profileId: input.profileId,
        sessionId,
        eventName: event.eventName,
        payload: event.payload,
        occurredAt: new Date(event.occurredAt),
        sequenceNumber: index,
      })),
    );

    return { sessionId };
  }

  async getProfileAnalytics(
    slug: string,
    from: Date,
    to: Date,
  ): Promise<AnalyticsSession[]> {
    return this.repository.getSessionsByProfileSlug(slug, from, to);
  }
}
