import type { LandingProfile } from "@mvp/core";
import type { ReactElement } from "react";
import { ContactLinks } from "./contact-links";
import { LandingFooter } from "./landing-footer";
import { ProjectCardGrid } from "./project-card-grid";

export function LandingPageView({
  profile,
  includePageChrome = true,
}: {
  profile: LandingProfile;
  includePageChrome?: boolean;
}): ReactElement {
  const content = (
    <>
      <div className="landing-shell">
        <section className="landing-identity">
          <h1 className="landing-name landing-animate-name">{profile.name}</h1>
          {profile.headline ? (
            <p className="landing-headline landing-animate-contact">
              {profile.headline}
            </p>
          ) : null}
          {profile.about ? (
            <p className="landing-about landing-animate-contact">
              {profile.about}
            </p>
          ) : null}
          <div className="landing-animate-contact">
            <ContactLinks profile={profile} />
          </div>
        </section>
        <div className="landing-animate-cards">
          <ProjectCardGrid profile={profile} />
        </div>
        <LandingFooter email={profile.email} name={profile.name} />
      </div>
    </>
  );

  return includePageChrome ? (
    <main className="landing-page">{content}</main>
  ) : (
    <>{content}</>
  );
}
