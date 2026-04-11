import { z } from "zod";

const slugParamsSchema = z.object({
  slug: z.string().min(1),
});

export async function parseSlugParams(
  params: Promise<{ slug: string }>,
): Promise<{ slug: string }> {
  return slugParamsSchema.parse(await params);
}
