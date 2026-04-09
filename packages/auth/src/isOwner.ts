import type { WhetIQSession } from "./types.js";

export function isOwner(session: WhetIQSession | null): boolean {
  if (!session?.user.email) {
    return false;
  }
  return session.user.email === process.env.WHETIQ_OWNER_EMAIL;
}
