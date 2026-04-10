import { requireOwner } from "@whetiq/auth";
import { analyticsDateRangeSchema } from "../../../../types/analytics.types.js";
import { analyticsService } from "../../../../lib/services.js";
import {
  createBadRequestResponse,
  createErrorResponse,
} from "../../../../lib/route-responses.js";
import { parseSlugParams } from "../../../../lib/route-params.js";

/**
 * Returns analytics sessions for the authenticated owner across a date range.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    await requireOwner();
    const url = new URL(request.url);
    const dateRange = analyticsDateRangeSchema.safeParse({
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
    });
    if (!dateRange.success) {
      return createBadRequestResponse(dateRange.error);
    }

    const { slug } = await parseSlugParams(context.params);
    const sessions = await analyticsService.getProfileAnalytics(
      slug,
      dateRange.data.from,
      dateRange.data.to,
    );

    return Response.json(sessions);
  } catch (error) {
    return createErrorResponse(error);
  }
}
