import { AnalyticsService } from "../services/analytics.service";
import { ParserService } from "../services/parser.service";
import { ProfileService } from "../services/profile.service";
import { PublishService } from "../services/publish.service";
import { TailoringService } from "../services/tailoring.service";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { E2EAnalyticsRepository } from "../repositories/e2e-analytics.repository";
import { E2EProfileRepository } from "../repositories/e2e-profile.repository";
import { ProfileRepository } from "../repositories/profile.repository";

const profileRepository =
  process.env.WHETIQ_E2E_MODE === "1"
    ? new E2EProfileRepository()
    : new ProfileRepository();
const analyticsRepository =
  process.env.WHETIQ_E2E_MODE === "1"
    ? new E2EAnalyticsRepository()
    : new AnalyticsRepository();

export const profileService = new ProfileService(profileRepository);
export const publishService = new PublishService(profileRepository);
export const analyticsService = new AnalyticsService(analyticsRepository);
export const tailoringService = new TailoringService();
export const parserService = new ParserService();
