export const DEFAULT_PROFILE_SLUG = "ethan";
export const NARRATIVE_BASE_PATH = "/narrative";

export function toNarrativePath(path: string): string {
  return `${NARRATIVE_BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
