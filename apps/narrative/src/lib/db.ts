import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function getDb(): NeonHttpDatabase<typeof schema> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for narrative data access");
  }

  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}
