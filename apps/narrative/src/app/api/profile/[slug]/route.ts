import { profileSchema } from "../../../../types/profile.types";
import { publishedProfileRouteDependencies } from "./route.dependencies";

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
