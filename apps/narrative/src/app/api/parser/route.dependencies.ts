import { requireOwner } from "@whetiq/auth";
import { parserService } from "../../../lib/services";
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
