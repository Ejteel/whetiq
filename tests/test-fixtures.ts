import type {
  AnalyticsEvent,
  AnalyticsSession,
  LandingProfile,
  NarrativeProfile,
  ParserResult,
  TailoringContext,
} from "@mvp/core";
import type { AnalyticsBatchInput } from "../apps/narrative/src/types/analytics.types";

export const narrativeProfileFixture: NarrativeProfile = {
  id: "profile-ethan",
  slug: "ethan",
  name: "Ethan J. Teel",
  location: "Austin, TX",
  availability: "Open to strategy and product roles",
  identityStatements: [
    {
      id: "identity-1",
      content: "Strategy-minded engineer building narrative systems.",
      privateLabel: "default",
      isActive: true,
    },
  ],
  summary: {
    fallback:
      "Engineer, operator, and strategist with a non-linear leadership journey.",
    contextSummaries: [
      {
        id: "ctx-1",
        triggerType: "manual",
        triggerValue: "fintech",
        label: "Fintech",
        content: "Connects platform engineering depth to fintech growth work.",
      },
    ],
  },
  timeline: [
    {
      id: "timeline-1",
      track: "work",
      role: "Product Strategy Lead",
      organization: "WhetIQ",
      startDate: { month: 1, year: 2025 },
      endDate: null,
      bullets: ["Built and shipped AI-driven narrative experiences."],
      tags: ["strategy", "product"],
      isVisible: true,
    },
  ],
};

export const parserResultFixture: ParserResult = {
  profile: narrativeProfileFixture,
  unmatchedContent: ["Volunteer work"],
  confidenceByField: {
    name: "high",
    location: "medium",
    availability: "low",
    "summary.fallback": "medium",
    "timeline.0": "medium",
  },
};

export const tailoringContextFixture: TailoringContext = {
  company: "Acme",
  role: "Head of Product",
  priorities: ["strategy", "execution"],
};

export const analyticsSessionFixture: AnalyticsSession = {
  profileId: narrativeProfileFixture.id,
  referrer: "https://www.linkedin.com/feed/",
  contextToken: "ctx-123",
  deviceType: "desktop",
  detectedCompany: null,
  createdAt: new Date("2026-04-10T12:00:00.000Z"),
};

export const analyticsEventFixture: AnalyticsEvent = {
  profileId: narrativeProfileFixture.id,
  sessionId: "session-1",
  eventName: "card_expand",
  payload: { cardId: "timeline-1" },
  occurredAt: new Date("2026-04-10T12:01:00.000Z"),
  sequenceNumber: 0,
};

export const analyticsBatchFixture: AnalyticsBatchInput = {
  profileId: narrativeProfileFixture.id,
  referrer: "https://www.linkedin.com/feed/",
  contextToken: "ctx-123",
  deviceType: "desktop",
  events: [
    {
      eventName: "session_start",
      payload: { path: "/narrative" },
      occurredAt: "2026-04-10T12:00:00.000Z",
    },
  ],
};

export const landingProfileFixture: LandingProfile = {
  name: "Ethan J. Teel",
  headline: "Building sharper professional operating systems.",
  about:
    "Operator, engineer, and strategist focused on narrative, product, and AI-enabled workflow systems.",
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
      isVisible: false,
      sortOrder: 1,
    },
  ],
};

export function cloneFixture<TValue>(value: TValue): TValue {
  return structuredClone(value);
}
