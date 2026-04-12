import { UnauthorizedError } from "@mvp/core";
import { getServerSession } from "next-auth";
import type { WhetIQSession } from "./types";
import { authOptions } from "./authOptions";
import { isOwner } from "./isOwner";

export async function requireOwner(): Promise<void> {
  // In E2E/dev mode, skip auth so owner workflows are testable without OAuth
  if (process.env.WHETIQ_E2E_MODE === "1") {
    return;
  }
  const session = await getServerSession(authOptions);
  if (!isOwner(session as WhetIQSession | null)) {
    throw new UnauthorizedError();
  }
}
