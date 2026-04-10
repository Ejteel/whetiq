import { tailoringService } from "../../../lib/services";
import {
  createBadRequestResponse,
  createErrorResponse,
} from "../../../lib/route-responses";

export const tailoringRouteDependencies = {
  createBadRequestResponse,
  createErrorResponse,
  tailoringService,
};
