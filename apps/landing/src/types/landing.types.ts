import { z } from "zod";

export const projectCardSchema = z.object({
  id: z.string(),
  name: z.string().max(60),
  description: z.string().max(120),
  status: z.enum(["live", "in_development", "coming_soon"]),
  url: z.string(),
  isExternal: z.boolean(),
  isVisible: z.boolean(),
  sortOrder: z.number().int().nonnegative(),
});

export const landingProfileSchema = z.object({
  name: z.string().min(1).max(60),
  headline: z.string().max(120).nullable(),
  about: z.string().max(500).nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  linkedin: z.string().nullable(),
  location: z.string().max(60).nullable(),
  cards: z.array(projectCardSchema),
});

export const landingProfilePatchSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  headline: z.string().max(120).nullable().optional(),
  about: z.string().max(500).nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  location: z.string().max(60).nullable().optional(),
  cards: z.array(projectCardSchema).optional(),
});

export type LandingProfilePayload = z.infer<typeof landingProfileSchema>;
export type LandingProfilePatchPayload = z.infer<
  typeof landingProfilePatchSchema
>;
