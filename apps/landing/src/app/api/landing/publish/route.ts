import { requireOwner } from "@whetiq/auth";
import { landingService } from "../../../../lib/services";
import { createErrorResponse } from "../../../../lib/route-responses";

/**
 * Publishes the landing draft for the authenticated owner.
 */
export async function POST(): Promise<Response> {
  try {
    await requireOwner();
    await landingService.publish();
    return Response.json({ status: "published" });
  } catch (error) {
    return createErrorResponse(error);
  }
}
