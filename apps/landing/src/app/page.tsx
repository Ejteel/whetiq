import { authOptions, isOwner } from "@whetiq/auth";
import { getServerSession } from "next-auth";
import type { ReactElement } from "react";
import { LandingPageShell } from "../components/edit/landing-page-shell";
import { LandingPageView } from "../components/view/landing-page-view";
import { landingService } from "../lib/services";
import { toWhetIQSession } from "../lib/session";

export const dynamic = "force-dynamic";

export default async function LandingPage(): Promise<ReactElement> {
  const session = await getServerSession(authOptions);
  const editMode = isOwner(toWhetIQSession(session));
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
    <LandingPageView profile={publishedProfile} />
  );
}
