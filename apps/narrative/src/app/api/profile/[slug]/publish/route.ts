import { requireOwner } from "@whetiq/auth";
import { publishService } from "../../../../../lib/services";
import { createErrorResponse } from "../../../../../lib/route-responses";
import { parseSlugParams } from "../../../../../lib/route-params";

export const publishProfileRouteDependencies = {
  createErrorResponse,
  parseSlugParams,
  publishService,
  requireOwner,
};

/**
 * Publishes the current draft for the authenticated owner.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    await publishProfileRouteDependencies.requireOwner();
    const { slug } = await publishProfileRouteDependencies.parseSlugParams(
      context.params,
    );
    await publishProfileRouteDependencies.publishService.publish(slug);
    return Response.json({ status: "published" });
  } catch (error) {
    return publishProfileRouteDependencies.createErrorResponse(error);
  }
}
