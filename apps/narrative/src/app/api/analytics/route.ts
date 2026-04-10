import { analyticsService } from "../../../lib/services.js";
import { analyticsBatchSchema } from "../../../types/analytics.types.js";
import {
  createBadRequestResponse,
  createErrorResponse,
} from "../../../lib/route-responses.js";

/**
 * Ingests a public batch of analytics events for the narrative profile.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result = analyticsBatchSchema.safeParse(body);
    if (!result.success) {
      return createBadRequestResponse(result.error);
    }

    const session = await analyticsService.recordBatch(result.data);
    return Response.json(session);
  } catch (error) {
    return createErrorResponse(error);
  }
}
