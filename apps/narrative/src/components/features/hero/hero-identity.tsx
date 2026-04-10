import type { NarrativeProfile } from "@mvp/core";
import type { ReactElement } from "react";
import { ScrollCue } from "./scroll-cue.js";

interface HeroIdentityProps {
  profile: NarrativeProfile;
}

export function HeroIdentity({ profile }: HeroIdentityProps): ReactElement {
  const activeStatement =
    profile.identityStatements.find((statement) => statement.isActive) ?? null;

  return (
    <section className="hero-identity">
      <div className="hero-copy">
        <p className="hero-kicker">Career narrative</p>
        <h1 className="hero-name">{profile.name}</h1>
        {activeStatement ? (
          <p className="hero-identity-statement">{activeStatement.content}</p>
        ) : null}
        <p className="hero-meta">
          <span>{profile.location}</span>
          <span className="hero-meta-dot" aria-hidden="true">
            •
          </span>
          <span>{profile.availability}</span>
        </p>
      </div>
      <ScrollCue />
    </section>
  );
}
