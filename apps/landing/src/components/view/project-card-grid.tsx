import type { LandingProfile } from "@mvp/core";
import type { ReactElement } from "react";

function formatStatus(
  status: LandingProfile["cards"][number]["status"],
): string {
  if (status === "live") {
    return "Live";
  }

  if (status === "in_development") {
    return "In Development";
  }

  return "Coming Soon";
}

export function ProjectCardGrid({
  profile,
}: {
  profile: LandingProfile;
}): ReactElement {
  const cards = [...profile.cards]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .filter((card) => card.isVisible);

  return (
    <section className="landing-cards" aria-label="Projects">
      {cards.map((card) => (
        <a
          key={card.id}
          className="landing-card-link"
          href={card.url}
          rel={card.isExternal ? "noopener noreferrer" : undefined}
          role="link"
          target={card.isExternal ? "_blank" : undefined}
        >
          <article className="landing-card">
            <div className="landing-card-header">
              <h2 className="landing-card-title">{card.name}</h2>
              <span
                className={`landing-status-badge landing-status-${card.status}`}
              >
                {formatStatus(card.status)}
              </span>
            </div>
            <p className="landing-card-description">{card.description}</p>
            <div className="landing-card-footer">
              <span className="landing-card-arrow" aria-hidden="true">
                →
              </span>
            </div>
          </article>
        </a>
      ))}
    </section>
  );
}
