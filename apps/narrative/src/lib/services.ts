import { AnalyticsService } from "../services/analytics.service";
import { ParserService } from "../services/parser.service";
import { ProfileService } from "../services/profile.service";
import { PublishService } from "../services/publish.service";
import { TailoringService } from "../services/tailoring.service";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { ProfileRepository } from "../repositories/profile.repository";

const profileRepository = new ProfileRepository();
const analyticsRepository = new AnalyticsRepository();

export const profileService = new ProfileService(profileRepository);
export const publishService = new PublishService(profileRepository);
export const analyticsService = new AnalyticsService(analyticsRepository);
export const tailoringService = new TailoringService();
export const parserService = new ParserService();
