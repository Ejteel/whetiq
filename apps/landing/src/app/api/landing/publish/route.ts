import { landingPublishRouteDependencies } from "../route.dependencies";

/**
 * Publishes the landing draft for the authenticated owner.
 */
export async function POST(): Promise<Response> {
  try {
    await landingPublishRouteDependencies.requireOwner();
    await landingPublishRouteDependencies.landingService.publish();
    return Response.json({ status: "published" });
  } catch (error) {
    return landingPublishRouteDependencies.createErrorResponse(error);
  }
}
