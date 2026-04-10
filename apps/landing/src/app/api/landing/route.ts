import { landingProfileSchema } from "../../../types/landing.types";
import { landingPublishedRouteDependencies } from "./route.dependencies";

/**
 * Returns the published landing page data.
 */
export async function GET(): Promise<Response> {
  try {
    const profile =
      await landingPublishedRouteDependencies.landingService.getPublished();
    return Response.json(landingProfileSchema.parse(profile));
  } catch (error) {
    return landingPublishedRouteDependencies.createErrorResponse(error);
  }
}
