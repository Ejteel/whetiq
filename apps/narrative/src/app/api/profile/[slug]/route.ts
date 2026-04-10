import { profileSchema } from "../../../../types/profile.types.js";
import { profileService } from "../../../../lib/services.js";
import { createErrorResponse } from "../../../../lib/route-responses.js";
import { parseSlugParams } from "../../../../lib/route-params.js";

/**
 * Returns the published profile for a public narrative URL.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    const { slug } = await parseSlugParams(context.params);
    const profile = await profileService.getPublishedBySlug(slug);
    return Response.json(profileSchema.parse(profile));
  } catch (error) {
    return createErrorResponse(error);
  }
}
