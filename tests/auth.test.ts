import assert from "node:assert/strict";
import test from "node:test";
import { UnauthorizedError } from "@mvp/core";
import { isOwner } from "../packages/auth/src/isOwner";
import {
  requireOwner,
  requireOwnerDependencies,
} from "../packages/auth/src/protect";

test("isOwner returns true only for the configured owner email", () => {
  const originalOwnerEmail = process.env.WHETIQ_OWNER_EMAIL;
  process.env.WHETIQ_OWNER_EMAIL = "owner@example.com";

  assert.equal(
    isOwner({
      user: { email: "owner@example.com", image: null, name: null },
      expires: "2026-04-10T00:00:00.000Z",
    }),
    true,
  );
  assert.equal(
    isOwner({
      user: { email: "other@example.com", image: null, name: null },
      expires: "2026-04-10T00:00:00.000Z",
    }),
    false,
  );

  process.env.WHETIQ_OWNER_EMAIL = originalOwnerEmail;
});

test("requireOwner resolves for the owner session and rejects otherwise", async () => {
  const originalDependencies = { ...requireOwnerDependencies };
  const originalOwnerEmail = process.env.WHETIQ_OWNER_EMAIL;
  process.env.WHETIQ_OWNER_EMAIL = "owner@example.com";

  requireOwnerDependencies.getServerSession = async () => ({
    expires: "2026-04-10T00:00:00.000Z",
    user: { email: "owner@example.com", image: null, name: null },
  });
  await requireOwner();

  requireOwnerDependencies.getServerSession = async () => ({
    expires: "2026-04-10T00:00:00.000Z",
    user: { email: "intruder@example.com", image: null, name: null },
  });

  await assert.rejects(() => requireOwner(), UnauthorizedError);

  Object.assign(requireOwnerDependencies, originalDependencies);
  process.env.WHETIQ_OWNER_EMAIL = originalOwnerEmail;
});
