import type { LandingProfile } from "@mvp/core";

export const defaultLandingProfile: LandingProfile = {
  name: "Ethan J. Teel",
  headline: null,
  about: null,
  email: null,
  phone: null,
  linkedin: null,
  location: null,
  cards: [
    {
      id: crypto.randomUUID(),
      name: "Career Narrative",
      description: "Interactive timeline-based professional narrative.",
      status: "in_development",
      url: "/narrative/ethan",
      isExternal: false,
      isVisible: true,
      sortOrder: 0,
    },
  ],
};
