import { AnalyticsService } from "../services/analytics.service.js";
import { ParserService } from "../services/parser.service.js";
import { ProfileService } from "../services/profile.service.js";
import { PublishService } from "../services/publish.service.js";
import { TailoringService } from "../services/tailoring.service.js";
import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import { ProfileRepository } from "../repositories/profile.repository.js";

const profileRepository = new ProfileRepository();
const analyticsRepository = new AnalyticsRepository();

export const profileService = new ProfileService(profileRepository);
export const publishService = new PublishService(profileRepository);
export const analyticsService = new AnalyticsService(analyticsRepository);
export const tailoringService = new TailoringService();
export const parserService = new ParserService();
