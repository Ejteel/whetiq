import type { AnalyticsBatchInput } from "../types/analytics.types";
import type { AnalyticsSummary } from "../types/analytics.types";
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
  ): Promise<AnalyticsSummary> {
    const sessions = await this.repository.getSessionsByProfileSlug(
      slug,
      from,
      to,
    );
    const byDeviceType = sessions.reduce<Record<string, number>>(
      (totals, session) => {
        totals[session.deviceType] = (totals[session.deviceType] ?? 0) + 1;
        return totals;
      },
      {},
    );
    const byReferrerMap = sessions.reduce<Map<string, number>>(
      (totals, session) => {
        const referrerLabel = session.referrer
          ? new URL(session.referrer).hostname
          : "Direct / unknown";
        totals.set(referrerLabel, (totals.get(referrerLabel) ?? 0) + 1);
        return totals;
      },
      new Map(),
    );
    const latestVisitAt =
      sessions.length === 0
        ? null
        : sessions
            .map((session) => session.createdAt)
            .sort((left, right) => right.getTime() - left.getTime())[0]
            .toISOString();

    return {
      totalSessions: sessions.length,
      byDeviceType,
      byReferrer: [...byReferrerMap.entries()]
        .map(([label, count]) => ({ label, sessions: count }))
        .sort((left, right) => right.sessions - left.sessions)
        .slice(0, 5),
      latestVisitAt,
    };
  }
}
