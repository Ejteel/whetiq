import { requireOwner } from "@whetiq/auth";
import { landingService } from "../../../lib/services";
import {
  createBadRequestResponse,
  createErrorResponse,
} from "../../../lib/route-responses";

export const landingPublishedRouteDependencies = {
  createErrorResponse,
  landingService,
};

export const landingDraftRouteDependencies = {
  createBadRequestResponse,
  createErrorResponse,
  landingService,
  requireOwner,
};

export const landingPublishRouteDependencies = {
  createErrorResponse,
  landingService,
  requireOwner,
};
