import { requireOwner } from "@whetiq/auth";
import { parserService } from "../../../lib/services";
import {
  parserRequestSchema,
  parserResultSchema,
} from "../../../types/tailoring.types";
import {
  createBadRequestResponse,
  createErrorResponse,
} from "../../../lib/route-responses";

export const parserRouteDependencies = {
  createBadRequestResponse,
  createErrorResponse,
  parserService,
  requireOwner,
};

/**
 * Parses an uploaded or pasted career document into structured profile data.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    await parserRouteDependencies.requireOwner();
    const body = await request.json();
    const result = parserRequestSchema.safeParse(body);
    if (!result.success) {
      return parserRouteDependencies.createBadRequestResponse(result.error);
    }

    const parsed = await parserRouteDependencies.parserService.parseDocument(
      result.data.documentText,
      result.data.fileName,
      result.data.mimeType,
    );

    return Response.json(parserResultSchema.parse(parsed));
  } catch (error) {
    return parserRouteDependencies.createErrorResponse(error);
  }
}
