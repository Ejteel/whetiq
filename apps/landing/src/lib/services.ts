import { E2ELandingRepository } from "../repositories/e2e-landing.repository";
import { LandingRepository } from "../repositories/landing.repository";
import { LandingService } from "../services/landing.service";

const landingRepository =
  process.env.WHETIQ_E2E_MODE === "1"
    ? new E2ELandingRepository()
    : new LandingRepository();

export const landingService = new LandingService(landingRepository);
