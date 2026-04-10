import type { LandingProfile } from "@mvp/core";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { landingVersionsTable } from "../lib/schema";
import { defaultLandingProfile } from "../lib/default-profile";

type LandingVersionName = "draft" | "published";

export class LandingRepository {
  async getDraft(): Promise<LandingProfile> {
    return this.#getVersion("draft");
  }

  async getPublished(): Promise<LandingProfile> {
    return this.#getVersion("published");
  }

  async saveDraft(data: LandingProfile): Promise<void> {
    const updatedRows = await getDb()
      .update(landingVersionsTable)
      .set({ data, updatedAt: new Date() })
      .where(eq(landingVersionsTable.version, "draft"))
      .returning({ id: landingVersionsTable.id });

    if (updatedRows.length === 0) {
      await this.#seedVersions();
      await this.saveDraft(data);
    }
  }

  async publish(): Promise<void> {
    const draft = await this.getDraft();
    const updatedRows = await getDb()
      .update(landingVersionsTable)
      .set({ data: draft, publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(landingVersionsTable.version, "published"))
      .returning({ id: landingVersionsTable.id });

    if (updatedRows.length === 0) {
      await this.#seedVersions();
      await this.publish();
    }
  }

  async #getVersion(version: LandingVersionName): Promise<LandingProfile> {
    const rows = await getDb()
      .select({ data: landingVersionsTable.data })
      .from(landingVersionsTable)
      .where(eq(landingVersionsTable.version, version))
      .limit(1);

    if (rows.length === 0) {
      await this.#seedVersions();
      return this.#getVersion(version);
    }

    return rows[0].data as LandingProfile;
  }

  async #seedVersions(): Promise<void> {
    await getDb()
      .insert(landingVersionsTable)
      .values([
        {
          id: crypto.randomUUID(),
          version: "draft",
          data: defaultLandingProfile,
          publishedAt: null,
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          version: "published",
          data: defaultLandingProfile,
          publishedAt: null,
          updatedAt: new Date(),
        },
      ])
      .onConflictDoNothing();
  }
}
