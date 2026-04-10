import { requireOwner } from "@whetiq/auth";
import {
  profilePatchSchema,
  profileSchema,
} from "../../../../../types/profile.types.js";
import { profileService } from "../../../../../lib/services.js";
import {
  createBadRequestResponse,
  createErrorResponse,
} from "../../../../../lib/route-responses.js";
import { parseSlugParams } from "../../../../../lib/route-params.js";

/**
 * Returns the current draft for the authenticated owner.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    await requireOwner();
    const { slug } = await parseSlugParams(context.params);
    const profile = await profileService.getDraftBySlug(slug);
    return Response.json(profileSchema.parse(profile));
  } catch (error) {
    return createErrorResponse(error);
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
    await requireOwner();
    const body = await request.json();
    const result = profilePatchSchema.safeParse(body);
    if (!result.success) {
      return createBadRequestResponse(result.error);
    }

    const { slug } = await parseSlugParams(context.params);
    const profile = await profileService.saveDraft(slug, result.data);
    return Response.json(profileSchema.parse(profile));
  } catch (error) {
    return createErrorResponse(error);
  }
}
