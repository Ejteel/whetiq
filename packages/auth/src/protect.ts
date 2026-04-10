import { UnauthorizedError } from "@mvp/core";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "./authOptions";
import { isOwner } from "./isOwner";
import type { WhetIQSession } from "./types";

function toWhetIQSession(session: Session | null): WhetIQSession | null {
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

export async function requireOwner(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!isOwner(toWhetIQSession(session))) {
    throw new UnauthorizedError();
  }
}
