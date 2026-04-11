import type { WhetIQSession } from "@whetiq/auth";
import type { Session } from "next-auth";

export function toWhetIQSession(session: Session | null): WhetIQSession | null {
  if (!session?.user?.email) {
    return null;
  }

  return {
    user: {
      email: session.user.email,
      name: session.user.name ?? null,
      image: session.user.image ?? null,
    },
    expires: session.expires,
  };
}
