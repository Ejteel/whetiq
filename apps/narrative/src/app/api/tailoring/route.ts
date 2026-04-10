import { tailoringService } from "../../../lib/services";
import {
  tailoringRequestSchema,
  tailoringResponseSchema,
} from "../../../types/tailoring.types";
import {
  createBadRequestResponse,
  createErrorResponse,
} from "../../../lib/route-responses";

/**
 * Returns a context-tailored summary for a profile snapshot.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result = tailoringRequestSchema.safeParse(body);
    if (!result.success) {
      return createBadRequestResponse(result.error);
    }

    const summary = await tailoringService.tailorSummary(
      result.data.profile,
      result.data.context,
    );
    return Response.json(tailoringResponseSchema.parse({ summary }));
  } catch (error) {
    return createErrorResponse(error);
  }
}
