import { profileSchema } from "../../../../types/profile.types";
import { profileService } from "../../../../lib/services";
import { createErrorResponse } from "../../../../lib/route-responses";
import { parseSlugParams } from "../../../../lib/route-params";

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
