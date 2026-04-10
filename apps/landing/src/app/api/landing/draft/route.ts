import { requireOwner } from "@whetiq/auth";
import { landingService } from "../../../../lib/services";
import {
  landingProfilePatchSchema,
  landingProfileSchema,
} from "../../../../types/landing.types";
import {
  createBadRequestResponse,
  createErrorResponse,
} from "../../../../lib/route-responses";

/**
 * Returns the authenticated owner's landing draft.
 */
export async function GET(): Promise<Response> {
  try {
    await requireOwner();
    const profile = await landingService.getDraft();
    return Response.json(landingProfileSchema.parse(profile));
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Updates the authenticated owner's landing draft.
 */
export async function PATCH(request: Request): Promise<Response> {
  try {
    await requireOwner();
    const body = await request.json();
    const result = landingProfilePatchSchema.safeParse(body);
    if (!result.success) {
      return createBadRequestResponse(result.error);
    }

    const profile = await landingService.saveDraft(result.data);
    return Response.json(landingProfileSchema.parse(profile));
  } catch (error) {
    return createErrorResponse(error);
  }
}
