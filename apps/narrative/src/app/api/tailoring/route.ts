import {
  tailoringRequestSchema,
  tailoringResponseSchema,
} from "../../../types/tailoring.types";
import { tailoringRouteDependencies } from "./route.dependencies";

/**
 * Returns a context-tailored summary for a profile snapshot.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result = tailoringRequestSchema.safeParse(body);
    if (!result.success) {
      return tailoringRouteDependencies.createBadRequestResponse(result.error);
    }

    const summary =
      await tailoringRouteDependencies.tailoringService.tailorSummary(
        result.data.profile,
        result.data.context,
      );
    return Response.json(tailoringResponseSchema.parse({ summary }));
  } catch (error) {
    return tailoringRouteDependencies.createErrorResponse(error);
  }
}
