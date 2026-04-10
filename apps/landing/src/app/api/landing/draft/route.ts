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

export const landingDraftRouteDependencies = {
  createBadRequestResponse,
  createErrorResponse,
  landingService,
  requireOwner,
};

/**
 * Returns the authenticated owner's landing draft.
 */
export async function GET(): Promise<Response> {
  try {
    await landingDraftRouteDependencies.requireOwner();
    const profile =
      await landingDraftRouteDependencies.landingService.getDraft();
    return Response.json(landingProfileSchema.parse(profile));
  } catch (error) {
    return landingDraftRouteDependencies.createErrorResponse(error);
  }
}

/**
 * Updates the authenticated owner's landing draft.
 */
export async function PATCH(request: Request): Promise<Response> {
  try {
    await landingDraftRouteDependencies.requireOwner();
    const body = await request.json();
    const result = landingProfilePatchSchema.safeParse(body);
    if (!result.success) {
      return landingDraftRouteDependencies.createBadRequestResponse(
        result.error,
      );
    }

    const profile =
      await landingDraftRouteDependencies.landingService.saveDraft(result.data);
    return Response.json(landingProfileSchema.parse(profile));
  } catch (error) {
    return landingDraftRouteDependencies.createErrorResponse(error);
  }
}
