import { jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const landingVersionsTable = pgTable("landing_versions", {
  id: uuid("id").primaryKey(),
  version: varchar("version", { length: 20 }).notNull().unique(),
  data: jsonb("data").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
