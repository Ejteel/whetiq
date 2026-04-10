import type { AnalyticsEvent, AnalyticsSession } from "./narrative.js";
import type { LandingProfile } from "./landing.js";
import type { NarrativeProfile } from "./narrative.js";

export interface E2EAnalyticsSessionRecord extends Omit<
  AnalyticsSession,
  "createdAt"
> {
  id: string;
  createdAt: string;
}

export interface E2EAnalyticsEventRecord extends Omit<
  AnalyticsEvent,
  "occurredAt"
> {
  id: string;
  occurredAt: string;
}

export interface E2EState {
  landing: {
    draft: LandingProfile;
    published: LandingProfile;
  };
  narrative: {
    draft: NarrativeProfile;
    published: NarrativeProfile;
    analyticsEvents: E2EAnalyticsEventRecord[];
    analyticsSessions: E2EAnalyticsSessionRecord[];
  };
}

export function createDefaultE2EState(): E2EState {
  const narrativeProfile: NarrativeProfile = {
    id: "profile-ethan",
    slug: "ethan",
    name: "Ethan J. Teel",
    location: "Austin, TX",
    availability: "Open to strategy and product leadership conversations",
    identityStatements: [
      {
        id: "identity-1",
        content:
          "Strategy-minded builder translating non-linear experience into business momentum.",
        privateLabel: "default",
        isActive: true,
      },
    ],
    summary: {
      fallback:
        "Engineer, operator, and strategist with a non-linear leadership path spanning military service, software delivery, and product strategy.",
      contextSummaries: [],
    },
    timeline: [
      {
        id: "timeline-1",
        track: "work",
        role: "Product Strategy Lead",
        organization: "WhetIQ",
        startDate: { month: 1, year: 2025 },
        endDate: null,
        bullets: [
          "Built narrative-first product experiences that adapt to audience context.",
        ],
        tags: ["strategy", "product"],
        isVisible: true,
      },
      {
        id: "timeline-2",
        track: "education",
        role: "MBA Candidate",
        organization: "University of Texas",
        startDate: { month: 8, year: 2024 },
        endDate: null,
        bullets: ["Focused on strategy and consulting."],
        tags: ["mba"],
        isVisible: true,
      },
    ],
  };

  const landingProfile: LandingProfile = {
    name: "Ethan J. Teel",
    headline: "Building sharper professional operating systems.",
    about:
      "Operator, engineer, and strategist focused on AI-enabled products, narrative systems, and decision-support experiences.",
    email: "ethan@example.com",
    phone: "555-0100",
    linkedin: "linkedin.com/in/ejteel",
    location: "Austin, TX",
    cards: [
      {
        id: "card-1",
        name: "Career Narrative",
        description: "Interactive timeline-based professional narrative.",
        status: "live",
        url: "/narrative",
        isExternal: false,
        isVisible: true,
        sortOrder: 0,
      },
      {
        id: "card-2",
        name: "Workspace",
        description: "Prompt enhancement workspace.",
        status: "coming_soon",
        url: "/workspace",
        isExternal: false,
        isVisible: true,
        sortOrder: 1,
      },
    ],
  };

  return {
    landing: {
      draft: structuredClone(landingProfile),
      published: structuredClone(landingProfile),
    },
    narrative: {
      draft: structuredClone(narrativeProfile),
      published: structuredClone(narrativeProfile),
      analyticsEvents: [],
      analyticsSessions: [],
    },
  };
}
