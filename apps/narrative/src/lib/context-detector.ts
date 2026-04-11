export function detectContextLabel(
  contextToken?: string | null,
  referrer?: string | null,
): string {
  if (contextToken) {
    return `TAILORED FOR ${contextToken.toUpperCase()}`;
  }
  if (referrer?.includes("linkedin.com")) {
    return "TAILORED FOR LINKEDIN";
  }
  if (referrer?.includes("greenhouse.io")) {
    return "TAILORED FOR GREENHOUSE";
  }
  return "CAREER OVERVIEW";
}
