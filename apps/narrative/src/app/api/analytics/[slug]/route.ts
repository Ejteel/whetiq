import { requireOwner } from "@whetiq/auth";
import { analyticsDateRangeSchema } from "../../../../types/analytics.types";
import { analyticsService } from "../../../../lib/services";
import {
  createBadRequestResponse,
  createErrorResponse,
} from "../../../../lib/route-responses";
import { parseSlugParams } from "../../../../lib/route-params";

export const analyticsProfileRouteDependencies = {
  analyticsService,
  createBadRequestResponse,
  createErrorResponse,
  parseSlugParams,
  requireOwner,
};

/**
 * Returns analytics sessions for the authenticated owner across a date range.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    await analyticsProfileRouteDependencies.requireOwner();
    const url = new URL(request.url);
    const dateRange = analyticsDateRangeSchema.safeParse({
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
    });
    if (!dateRange.success) {
      return analyticsProfileRouteDependencies.createBadRequestResponse(
        dateRange.error,
      );
    }

    const { slug } = await analyticsProfileRouteDependencies.parseSlugParams(
      context.params,
    );
    const sessions =
      await analyticsProfileRouteDependencies.analyticsService.getProfileAnalytics(
        slug,
        dateRange.data.from,
        dateRange.data.to,
      );

    return Response.json(sessions);
  } catch (error) {
    return analyticsProfileRouteDependencies.createErrorResponse(error);
  }
}
