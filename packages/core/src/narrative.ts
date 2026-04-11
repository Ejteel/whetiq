export type TrackType = "work" | "education" | "military" | "other";

export interface MonthYear {
  month: number;
  year: number;
}

export interface TimelineEntry {
  id: string;
  track: TrackType;
  role: string;
  organization: string;
  startDate: MonthYear;
  endDate: MonthYear | null;
  bullets: string[];
  tags: string[];
  isVisible: boolean;
}

export interface IdentityStatement {
  id: string;
  content: string;
  privateLabel: string;
  isActive: boolean;
}

export interface ContextSummary {
  id: string;
  triggerType: "ctx_param" | "referrer" | "manual";
  triggerValue: string;
  label: string;
  content: string;
}

export interface ProfileSummary {
  fallback: string;
  contextSummaries: ContextSummary[];
}

export interface NarrativeProfile {
  id: string;
  slug: string;
  name: string;
  location: string;
  availability: string;
  identityStatements: IdentityStatement[];
  summary: ProfileSummary;
  timeline: TimelineEntry[];
}

export type PartialNarrativeProfile = Partial<NarrativeProfile>;

export interface ProfileVersionRecord {
  profileId: string;
  version: "draft" | "published";
  data: NarrativeProfile;
  publishedAt: Date | null;
  updatedAt: Date;
}

export interface TailoringContext {
  token?: string;
  company?: string;
  role?: string;
  industry?: string;
  seniority?: string;
  priorities: string[];
}

export interface AnalyticsSession {
  profileId: string;
  referrer: string | null;
  contextToken: string | null;
  deviceType: "desktop" | "tablet" | "mobile";
  detectedCompany: string | null;
  createdAt: Date;
}

export interface AnalyticsEvent {
  profileId: string;
  sessionId: string;
  eventName: string;
  payload: Record<string, string | number | boolean | null>;
  occurredAt: Date;
  sequenceNumber: number;
}

export interface ParserResult {
  profile: NarrativeProfile;
  unmatchedContent: string[];
  confidenceByField: Record<string, "high" | "medium" | "low">;
}
