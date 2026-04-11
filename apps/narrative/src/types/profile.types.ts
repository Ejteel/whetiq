import { z } from "zod";

const monthYearSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1900).max(2100),
});

export const identityStatementSchema = z.object({
  id: z.string(),
  content: z.string().max(80),
  privateLabel: z.string(),
  isActive: z.boolean(),
});

export const contextSummarySchema = z.object({
  id: z.string(),
  triggerType: z.enum(["ctx_param", "referrer", "manual"]),
  triggerValue: z.string(),
  label: z.string(),
  content: z.string().max(400),
});

export const profileSummarySchema = z.object({
  fallback: z.string().max(400),
  contextSummaries: z.array(contextSummarySchema).max(5),
});

export const timelineEntrySchema = z.object({
  id: z.string(),
  track: z.enum(["work", "education", "military", "other"]),
  role: z.string().max(80),
  organization: z.string().max(80),
  startDate: monthYearSchema,
  endDate: monthYearSchema.nullable(),
  bullets: z.array(z.string().max(160)).min(1).max(4),
  tags: z.array(z.string().max(24)).max(5),
  isVisible: z.boolean(),
});

export const profileSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string().min(1),
  location: z.string().max(60),
  availability: z.string().max(60),
  identityStatements: z.array(identityStatementSchema).max(5),
  summary: profileSummarySchema,
  timeline: z.array(timelineEntrySchema),
});

export const profilePatchSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().max(60).optional(),
  availability: z.string().max(60).optional(),
  identityStatements: z.array(identityStatementSchema).max(5).optional(),
  summary: z
    .object({
      fallback: z.string().max(400).optional(),
      contextSummaries: z.array(contextSummarySchema).max(5).optional(),
    })
    .optional(),
  timeline: z.array(timelineEntrySchema).optional(),
});

export type ProfilePayload = z.infer<typeof profileSchema>;
export type ProfilePatchPayload = z.infer<typeof profilePatchSchema>;
