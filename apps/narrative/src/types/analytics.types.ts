import { z } from "zod";
import { analyticsEventNames } from "../config/analytics.config";

export const analyticsEventSchema = z.object({
  eventName: z.enum(analyticsEventNames),
  payload: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()]),
  ),
  occurredAt: z.string(),
});

export const analyticsBatchSchema = z.object({
  profileId: z.string(),
  sessionId: z.string().optional(),
  referrer: z.string().nullable().optional(),
  contextToken: z.string().nullable().optional(),
  deviceType: z.enum(["desktop", "tablet", "mobile"]),
  events: z.array(analyticsEventSchema).min(1),
});

export const analyticsDateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export const analyticsSessionSchema = z.object({
  profileId: z.string(),
  referrer: z.string().nullable(),
  contextToken: z.string().nullable(),
  deviceType: z.enum(["desktop", "tablet", "mobile"]),
  detectedCompany: z.string().nullable(),
  createdAt: z.date(),
});

export const analyticsSummarySchema = z.object({
  totalSessions: z.number().int().nonnegative(),
  byDeviceType: z.record(z.string(), z.number().int().nonnegative()),
  byReferrer: z.array(
    z.object({
      label: z.string(),
      sessions: z.number().int().nonnegative(),
    }),
  ),
  latestVisitAt: z.string().nullable(),
});

export type AnalyticsBatchInput = z.infer<typeof analyticsBatchSchema>;
export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;
