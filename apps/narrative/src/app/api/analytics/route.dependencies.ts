import { requireOwner } from "@whetiq/auth";
import { analyticsService } from "../../../lib/services";
import {
  createBadRequestResponse,
  createErrorResponse,
} from "../../../lib/route-responses";
import { parseSlugParams } from "../../../lib/route-params";

export const analyticsBatchRouteDependencies = {
  analyticsService,
  createBadRequestResponse,
  createErrorResponse,
};

export const analyticsProfileRouteDependencies = {
  analyticsService,
  createBadRequestResponse,
  createErrorResponse,
  parseSlugParams,
  requireOwner,
};
