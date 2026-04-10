import { requireOwner } from "@whetiq/auth";
import { profileService, publishService } from "../../../../lib/services";
import {
  createBadRequestResponse,
  createErrorResponse,
} from "../../../../lib/route-responses";
import { parseSlugParams } from "../../../../lib/route-params";

export const publishedProfileRouteDependencies = {
  createErrorResponse,
  parseSlugParams,
  profileService,
};

export const draftProfileRouteDependencies = {
  createBadRequestResponse,
  createErrorResponse,
  parseSlugParams,
  profileService,
  requireOwner,
};

export const publishProfileRouteDependencies = {
  createErrorResponse,
  parseSlugParams,
  publishService,
  requireOwner,
};
