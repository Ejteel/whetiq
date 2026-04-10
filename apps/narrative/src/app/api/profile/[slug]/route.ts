import { profileSchema } from "../../../../types/profile.types";
import { profileService } from "../../../../lib/services";
import { createErrorResponse } from "../../../../lib/route-responses";
import { parseSlugParams } from "../../../../lib/route-params";

export const publishedProfileRouteDependencies = {
  createErrorResponse,
  parseSlugParams,
  profileService,
};

/**
 * Returns the published profile for a public narrative URL.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    const { slug } = await publishedProfileRouteDependencies.parseSlugParams(
      context.params,
    );
    const profile =
      await publishedProfileRouteDependencies.profileService.getPublishedBySlug(
        slug,
      );
    return Response.json(profileSchema.parse(profile));
  } catch (error) {
    return publishedProfileRouteDependencies.createErrorResponse(error);
  }
}
