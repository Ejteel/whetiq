import { UnauthorizedError } from "@mvp/core";
import { getServerSession } from "next-auth";
import type { WhetIQSession } from "./types";
import { authOptions } from "./authOptions";
import { isOwner } from "./isOwner";

export async function requireOwner(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!isOwner(session as WhetIQSession | null)) {
    throw new UnauthorizedError();
  }
}
