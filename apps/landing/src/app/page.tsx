import { authOptions, isOwner } from "@whetiq/auth";
import type { WhetIQSession } from "@whetiq/auth";
import { getServerSession } from "next-auth";
import type { ReactElement } from "react";
import { LandingPageShell } from "../components/edit/landing-page-shell";
import { LandingPageView } from "../components/view/landing-page-view";
import { landingService } from "../lib/services";

export const dynamic = "force-dynamic";

interface LandingPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function LandingPage({
  searchParams,
}: LandingPageProps): Promise<ReactElement> {
  const { edit } = await searchParams;
  const session = await getServerSession(authOptions);
  const ownerSession = isOwner(session as WhetIQSession | null);
  const editMode = ownerSession && edit === "owner";
  const showOwnerEntry = edit === "owner" && !ownerSession;
  const [publishedProfile, draftProfile] = await Promise.all([
    landingService.getPublished(),
    editMode ? landingService.getDraft() : Promise.resolve(null),
  ]);

  return editMode && draftProfile ? (
    <LandingPageShell
      draftProfile={draftProfile}
      publishedProfile={publishedProfile}
    />
  ) : (
    <LandingPageView
      callbackUrl="/?edit=owner"
      profile={publishedProfile}
      showOwnerEntry={showOwnerEntry}
    />
  );
}
