import assert from "node:assert/strict";
import test from "node:test";
import { isOwner } from "../packages/auth/src/isOwner";

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
