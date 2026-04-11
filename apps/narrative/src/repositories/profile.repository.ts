import { createDefaultE2EState, ResourceNotFoundError } from "@mvp/core";
import type { NarrativeProfile } from "@mvp/core";
import { and, desc, eq } from "drizzle-orm";
import type { IProfileRepository } from "@mvp/storage";
import { DEFAULT_PROFILE_SLUG } from "../config/app.config";
import { getDb } from "../lib/db";
import { profilesTable, profileVersionsTable } from "../lib/schema";

type ProfileVersionName = "draft" | "published";

export class ProfileRepository implements IProfileRepository {
  constructor(private readonly database = getDb) {}

  async getDraft(profileId: string): Promise<NarrativeProfile> {
    return this.#getVersion(profileId, "draft");
  }

  async getPublished(profileId: string): Promise<NarrativeProfile> {
    return this.#getVersion(profileId, "published");
  }

  async getDraftBySlug(slug: string): Promise<NarrativeProfile> {
    return this.#getVersionBySlug(slug, "draft");
  }

  async getPublishedBySlug(slug: string): Promise<NarrativeProfile> {
    return this.#getVersionBySlug(slug, "published");
  }

  async saveDraft(profileId: string, data: NarrativeProfile): Promise<void> {
    const updatedRows = await this.database()
      .update(profileVersionsTable)
      .set({ data, updatedAt: new Date() })
      .where(
        and(
          eq(profileVersionsTable.profileId, profileId),
          eq(profileVersionsTable.version, "draft"),
        ),
      )
      .returning({ id: profileVersionsTable.id });

    if (updatedRows.length === 0) {
      throw new ResourceNotFoundError("Profile draft", profileId);
    }
  }

  async publish(profileId: string): Promise<void> {
    const draft = await this.getDraft(profileId);
    const updatedRows = await this.database()
      .update(profileVersionsTable)
      .set({ data: draft, publishedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(profileVersionsTable.profileId, profileId),
          eq(profileVersionsTable.version, "published"),
        ),
      )
      .returning({ id: profileVersionsTable.id });

    if (updatedRows.length === 0) {
      throw new ResourceNotFoundError("Published profile", profileId);
    }
  }

  async #getVersion(
    profileId: string,
    version: ProfileVersionName,
  ): Promise<NarrativeProfile> {
    const rows = await this.database()
      .select({ data: profileVersionsTable.data })
      .from(profileVersionsTable)
      .where(
        and(
          eq(profileVersionsTable.profileId, profileId),
          eq(profileVersionsTable.version, version),
        ),
      )
      .orderBy(desc(profileVersionsTable.updatedAt))
      .limit(1);

    if (rows.length === 0) {
      throw new ResourceNotFoundError(
        "Profile version",
        `${profileId}:${version}`,
      );
    }

    const row = rows[0];
    return row.data as NarrativeProfile;
  }

  async #getVersionBySlug(
    slug: string,
    version: ProfileVersionName,
  ): Promise<NarrativeProfile> {
    const rows = await this.database()
      .select({ profileId: profilesTable.id })
      .from(profilesTable)
      .where(eq(profilesTable.slug, slug))
      .orderBy(desc(profilesTable.createdAt))
      .limit(1);

    if (rows.length === 0) {
      await this.#seedDefaultProfile(slug);
      const seededRows = await this.database()
        .select({ profileId: profilesTable.id })
        .from(profilesTable)
        .where(eq(profilesTable.slug, slug))
        .orderBy(desc(profilesTable.createdAt))
        .limit(1);

      if (seededRows.length > 0) {
        return this.#getVersion(seededRows[0].profileId, version);
      }

      throw new ResourceNotFoundError("Profile", slug);
    }

    const row = rows[0];
    return this.#getVersion(row.profileId, version);
  }

  async #seedDefaultProfile(slug: string): Promise<void> {
    if (slug !== DEFAULT_PROFILE_SLUG) {
      return;
    }

    const defaultProfile = createDefaultE2EState().narrative.published;
    const ownerId = process.env.WHETIQ_OWNER_EMAIL ?? "owner@whetiq.local";

    await this.database()
      .insert(profilesTable)
      .values({
        id: defaultProfile.id,
        slug: defaultProfile.slug,
        ownerId,
        createdAt: new Date(),
      })
      .onConflictDoNothing();

    await this.database()
      .insert(profileVersionsTable)
      .values([
        {
          id: crypto.randomUUID(),
          profileId: defaultProfile.id,
          version: "draft",
          data: createDefaultE2EState().narrative.draft,
          publishedAt: null,
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          profileId: defaultProfile.id,
          version: "published",
          data: defaultProfile,
          publishedAt: new Date(),
          updatedAt: new Date(),
        },
      ])
      .onConflictDoNothing();
  }
}
