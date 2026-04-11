import { ResourceNotFoundError } from "@mvp/core";
import { authOptions, isOwner } from "@whetiq/auth";
import type { WhetIQSession } from "@whetiq/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { NarrativePageShell } from "../../../components/features/edit/narrative-page-shell";
import { decodeContextToken } from "../../../lib/token-decoder";
import { profileService } from "../../../lib/services";

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ctx?: string; preview?: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
  searchParams,
}: ProfilePageProps): Promise<ReactElement> {
  const [{ slug }, { ctx, preview }] = await Promise.all([
    params,
    searchParams,
  ]);
  const session = await getServerSession(authOptions);
  const editMode = isOwner(session as WhetIQSession | null);
  const isPreviewMode = editMode && preview === "visitor";

  try {
    const publishedProfile = await profileService.getPublishedBySlug(slug);
    const draftProfile = editMode
      ? await profileService.getDraftBySlug(slug)
      : null;

    return (
      <NarrativePageShell
        draftProfile={draftProfile}
        editMode={editMode}
        initialContextToken={decodeContextToken(ctx ?? null)}
        isPreviewMode={isPreviewMode}
        publishedProfile={publishedProfile}
        slug={slug}
      />
    );
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      notFound();
    }

    throw error;
  }
}
