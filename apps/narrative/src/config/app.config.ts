export const DEFAULT_PROFILE_SLUG = "ethan";
export const DEFAULT_PROFILE_RECORD_ID = "0f8c4e9c-c5ec-4d64-a43e-bd5f5b23a8d1";
export const NARRATIVE_BASE_PATH = "/narrative";

export function toNarrativePath(path: string): string {
  return `${NARRATIVE_BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
