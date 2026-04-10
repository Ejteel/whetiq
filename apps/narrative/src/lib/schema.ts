import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const profilesTable = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  ownerId: varchar("owner_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const profileVersionsTable = pgTable("profile_versions", {
  id: uuid("id").primaryKey(),
  profileId: uuid("profile_id").notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  data: jsonb("data").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const analyticsSessionsTable = pgTable("analytics_sessions", {
  id: uuid("id").primaryKey(),
  profileId: uuid("profile_id").notNull(),
  referrer: text("referrer"),
  contextToken: text("context_token"),
  deviceType: varchar("device_type", { length: 20 }).notNull(),
  detectedCompany: varchar("detected_company", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const analyticsEventsTable = pgTable("analytics_events", {
  id: uuid("id").primaryKey(),
  sessionId: uuid("session_id").notNull(),
  profileId: uuid("profile_id").notNull(),
  eventName: varchar("event_name", { length: 64 }).notNull(),
  payload: jsonb("payload").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  isProcessed: boolean("is_processed").notNull().default(false),
  sequenceNumber: integer("sequence_number").notNull().default(0),
});
