import type { WhetIQSession } from "./types";

export function isOwner(session: WhetIQSession | null): boolean {
  if (process.env.WHETIQ_E2E_MODE === "1") {
    return true;
  }
  if (!session?.user.email) {
    return false;
  }
  return session.user.email === process.env.WHETIQ_OWNER_EMAIL;
}
