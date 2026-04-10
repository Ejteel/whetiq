import { landingService } from "../../../lib/services";
import { landingProfileSchema } from "../../../types/landing.types";
import { createErrorResponse } from "../../../lib/route-responses";

/**
 * Returns the published landing page data.
 */
export async function GET(): Promise<Response> {
  try {
    const profile = await landingService.getPublished();
    return Response.json(landingProfileSchema.parse(profile));
  } catch (error) {
    return createErrorResponse(error);
  }
}
