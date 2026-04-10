import { requireOwner } from "@whetiq/auth";
import { publishService } from "../../../../../lib/services";
import { createErrorResponse } from "../../../../../lib/route-responses";
import { parseSlugParams } from "../../../../../lib/route-params";

/**
 * Publishes the current draft for the authenticated owner.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    await requireOwner();
    const { slug } = await parseSlugParams(context.params);
    await publishService.publish(slug);
    return Response.json({ status: "published" });
  } catch (error) {
    return createErrorResponse(error);
  }
}
