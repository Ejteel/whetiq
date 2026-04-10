import type { AnalyticsEvent, AnalyticsSession } from "@mvp/core";
import { and, eq, gte, lte } from "drizzle-orm";
import type { IAnalyticsRepository } from "@mvp/storage";
import { getDb } from "../lib/db";
import {
  analyticsEventsTable,
  analyticsSessionsTable,
  profilesTable,
} from "../lib/schema";
import { analyticsSessionSchema } from "../types/analytics.types";

export class AnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly database = getDb) {}

  async createSession(session: AnalyticsSession): Promise<string> {
    const sessionId = crypto.randomUUID();
    await this.database().insert(analyticsSessionsTable).values({
      id: sessionId,
      profileId: session.profileId,
      referrer: session.referrer,
      contextToken: session.contextToken,
      deviceType: session.deviceType,
      detectedCompany: session.detectedCompany,
      createdAt: session.createdAt,
    });

    return sessionId;
  }

  async recordEvents(
    _sessionId: string,
    events: AnalyticsEvent[],
  ): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await this.database()
      .insert(analyticsEventsTable)
      .values(
        events.map((event) => ({
          id: crypto.randomUUID(),
          sessionId: event.sessionId,
          profileId: event.profileId,
          eventName: event.eventName,
          payload: event.payload,
          occurredAt: event.occurredAt,
          sequenceNumber: event.sequenceNumber,
        })),
      );
  }

  async getSessionsByProfile(
    profileId: string,
    from: Date,
    to: Date,
  ): Promise<AnalyticsSession[]> {
    const rows = await this.database()
      .select({
        profileId: analyticsSessionsTable.profileId,
        referrer: analyticsSessionsTable.referrer,
        contextToken: analyticsSessionsTable.contextToken,
        deviceType: analyticsSessionsTable.deviceType,
        detectedCompany: analyticsSessionsTable.detectedCompany,
        createdAt: analyticsSessionsTable.createdAt,
      })
      .from(analyticsSessionsTable)
      .where(
        and(
          eq(analyticsSessionsTable.profileId, profileId),
          gte(analyticsSessionsTable.createdAt, from),
          lte(analyticsSessionsTable.createdAt, to),
        ),
      );

    return rows.map((row) => analyticsSessionSchema.parse(row));
  }

  async getSessionsByProfileSlug(
    slug: string,
    from: Date,
    to: Date,
  ): Promise<AnalyticsSession[]> {
    const rows = await this.database()
      .select({ profileId: profilesTable.id })
      .from(profilesTable)
      .where(eq(profilesTable.slug, slug))
      .limit(1);

    if (rows.length === 0) {
      return [];
    }

    const row = rows[0];
    return this.getSessionsByProfile(row.profileId, from, to);
  }
}
