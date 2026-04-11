import { z } from "zod";
import { profileSchema } from "./profile.types";

export const tailoringContextSchema = z.object({
  token: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  industry: z.string().optional(),
  seniority: z.string().optional(),
  priorities: z.array(z.string()).default([]),
});

export const tailoringRequestSchema = z.object({
  profile: profileSchema,
  context: tailoringContextSchema,
});

export const parserRequestSchema = z.object({
  documentText: z.string().min(1),
  fileName: z.string(),
  mimeType: z.string(),
});

export const parserResultSchema = z.object({
  profile: profileSchema,
  unmatchedContent: z.array(z.string()),
  confidenceByField: z.record(z.enum(["high", "medium", "low"])),
});

export const tailoringResponseSchema = z.object({
  summary: z.string(),
});
