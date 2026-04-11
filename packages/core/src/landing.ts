export type LandingCardStatus = "live" | "in_development" | "coming_soon";

export interface ProjectCard {
  id: string;
  name: string;
  description: string;
  status: LandingCardStatus;
  url: string;
  isExternal: boolean;
  isVisible: boolean;
  sortOrder: number;
}

export interface LandingProfile {
  name: string;
  headline: string | null;
  about: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  location: string | null;
  cards: ProjectCard[];
}
