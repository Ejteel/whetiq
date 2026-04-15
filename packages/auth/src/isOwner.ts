import type { WhetIQSession } from "./types";

export function isOwner(session: WhetIQSession | null): boolean {
  if (process.env.WHETIQ_E2E_MODE === "1") {
    // Grant ownership only when an owner email is explicitly configured.
    // Leaving WHETIQ_OWNER_EMAIL empty simulates a visitor session.
    return !!process.env.WHETIQ_OWNER_EMAIL;
  }
  if (!session?.user.email) {
    return false;
  }
  return session.user.email === process.env.WHETIQ_OWNER_EMAIL;
}
