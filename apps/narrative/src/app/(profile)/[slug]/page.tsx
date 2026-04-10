import { ResourceNotFoundError } from "@mvp/core";
import { authOptions, isOwner } from "@whetiq/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { AISummaryPanel } from "../../../components/features/hero/ai-summary-panel.js";
import { HeroIdentity } from "../../../components/features/hero/hero-identity.js";
import { EditBar } from "../../../components/features/edit/edit-bar.js";
import { TimelineSpine } from "../../../components/features/timeline/timeline-spine.js";
import { decodeContextToken } from "../../../lib/token-decoder.js";
import { profileService } from "../../../lib/services.js";
import { toWhetIQSession } from "../../../lib/session.js";

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ctx?: string; preview?: string }>;
}

export default async function ProfilePage({
  params,
  searchParams,
}: ProfilePageProps): Promise<ReactElement> {
  const [{ slug }, { ctx, preview }] = await Promise.all([
    params,
    searchParams,
  ]);
  const session = await getServerSession(authOptions);
  const editMode = isOwner(toWhetIQSession(session));
  const isPreviewMode = editMode && preview === "visitor";

  try {
    const profile =
      editMode && !isPreviewMode
        ? await profileService.getDraftBySlug(slug)
        : await profileService.getPublishedBySlug(slug);

    return (
      <main className="narrative-page">
        {editMode ? <EditBar isPreviewMode={isPreviewMode} /> : null}
        <section className="hero-section">
          <HeroIdentity profile={profile} />
          <AISummaryPanel
            profile={profile}
            initialContextToken={decodeContextToken(ctx ?? null)}
            editMode={editMode}
          />
        </section>
        <TimelineSpine profile={profile} />
      </main>
    );
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      notFound();
    }

    throw error;
  }
}
