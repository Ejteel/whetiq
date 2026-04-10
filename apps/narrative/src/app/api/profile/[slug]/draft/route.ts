import { requireOwner } from "@whetiq/auth";
import {
  profilePatchSchema,
  profileSchema,
} from "../../../../../types/profile.types";
import { profileService } from "../../../../../lib/services";
import {
  createBadRequestResponse,
  createErrorResponse,
} from "../../../../../lib/route-responses";
import { parseSlugParams } from "../../../../../lib/route-params";

export const draftProfileRouteDependencies = {
  createBadRequestResponse,
  createErrorResponse,
  parseSlugParams,
  profileService,
  requireOwner,
};

/**
 * Returns the current draft for the authenticated owner.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    await draftProfileRouteDependencies.requireOwner();
    const { slug } = await draftProfileRouteDependencies.parseSlugParams(
      context.params,
    );
    const profile =
      await draftProfileRouteDependencies.profileService.getDraftBySlug(slug);
    return Response.json(profileSchema.parse(profile));
  } catch (error) {
    return draftProfileRouteDependencies.createErrorResponse(error);
  }
}

/**
 * Applies a partial draft update for the authenticated owner.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    await draftProfileRouteDependencies.requireOwner();
    const body = await request.json();
    const result = profilePatchSchema.safeParse(body);
    if (!result.success) {
      return draftProfileRouteDependencies.createBadRequestResponse(
        result.error,
      );
    }

    const { slug } = await draftProfileRouteDependencies.parseSlugParams(
      context.params,
    );
    const profile =
      await draftProfileRouteDependencies.profileService.saveDraft(
        slug,
        result.data,
      );
    return Response.json(profileSchema.parse(profile));
  } catch (error) {
    return draftProfileRouteDependencies.createErrorResponse(error);
  }
}
