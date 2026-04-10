import assert from "node:assert/strict";
import test from "node:test";
import { LandingService } from "../apps/landing/src/services/landing.service";
import { cloneFixture, landingProfileFixture } from "./test-fixtures";

test("LandingService delegates published and draft retrieval", async () => {
  const calls: string[] = [];
  const service = new LandingService({
    async getDraft() {
      calls.push("draft");
      return cloneFixture(landingProfileFixture);
    },
    async getPublished() {
      calls.push("published");
      return cloneFixture(landingProfileFixture);
    },
    async publish() {},
    async saveDraft() {},
  });

  await service.getPublished();
  await service.getDraft();

  assert.deepEqual(calls, ["published", "draft"]);
});

test("LandingService.saveDraft merges the patch into the current draft", async () => {
  let savedProfile = cloneFixture(landingProfileFixture);
  const service = new LandingService({
    async getDraft() {
      return cloneFixture(landingProfileFixture);
    },
    async getPublished() {
      return cloneFixture(landingProfileFixture);
    },
    async publish() {},
    async saveDraft(data) {
      savedProfile = data;
    },
  });

  const result = await service.saveDraft({
    headline: "Updated headline",
    cards: [
      {
        ...cloneFixture(landingProfileFixture.cards[0]),
        name: "Updated card",
      },
    ],
  });

  assert.equal(result.headline, "Updated headline");
  assert.equal(result.cards[0]?.name, "Updated card");
  assert.equal(savedProfile.cards.length, 1);
});

test("LandingService.publish delegates to the repository", async () => {
  let publishCalls = 0;
  const service = new LandingService({
    async getDraft() {
      return cloneFixture(landingProfileFixture);
    },
    async getPublished() {
      return cloneFixture(landingProfileFixture);
    },
    async publish() {
      publishCalls += 1;
    },
    async saveDraft() {},
  });

  await service.publish();

  assert.equal(publishCalls, 1);
});
