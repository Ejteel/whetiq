import { LandingRepository } from "../repositories/landing.repository";
import { LandingService } from "../services/landing.service";

const landingRepository = new LandingRepository();

export const landingService = new LandingService(landingRepository);
