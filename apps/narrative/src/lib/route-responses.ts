import { ResourceNotFoundError, UnauthorizedError } from "@mvp/core";
import { ZodError } from "zod";

export function createBadRequestResponse(error: ZodError): Response {
  return Response.json({ error: error.flatten() }, { status: 400 });
}

export function createErrorResponse(error: unknown): Response {
  if (error instanceof UnauthorizedError) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (error instanceof ResourceNotFoundError) {
    return Response.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof ZodError) {
    return createBadRequestResponse(error);
  }

  return Response.json({ error: "Something went wrong" }, { status: 500 });
}
