import { analyticsService } from "../../../lib/services";
import { analyticsBatchSchema } from "../../../types/analytics.types";
import {
  createBadRequestResponse,
  createErrorResponse,
} from "../../../lib/route-responses";

export const analyticsBatchRouteDependencies = {
  analyticsService,
  createBadRequestResponse,
  createErrorResponse,
};

/**
 * Ingests a public batch of analytics events for the narrative profile.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result = analyticsBatchSchema.safeParse(body);
    if (!result.success) {
      return analyticsBatchRouteDependencies.createBadRequestResponse(
        result.error,
      );
    }

    const session =
      await analyticsBatchRouteDependencies.analyticsService.recordBatch(
        result.data,
      );
    return Response.json(session);
  } catch (error) {
    return analyticsBatchRouteDependencies.createErrorResponse(error);
  }
}
