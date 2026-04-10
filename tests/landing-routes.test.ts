import assert from "node:assert/strict";
import test from "node:test";
import {
  GET as getLandingDraft,
  PATCH as patchLandingDraft,
  landingDraftRouteDependencies,
} from "../apps/landing/src/app/api/landing/draft/route";
import {
  POST as postLandingPublish,
  landingPublishRouteDependencies,
} from "../apps/landing/src/app/api/landing/publish/route";
import {
  GET as getLandingPublished,
  landingPublishedRouteDependencies,
} from "../apps/landing/src/app/api/landing/route";
import { cloneFixture, landingProfileFixture } from "./test-fixtures";

function restoreDependencies<TDependencies extends Record<string, unknown>>(
  dependencies: TDependencies,
): () => void {
  const original = { ...dependencies };
  return () => {
    Object.assign(dependencies, original);
  };
}

test("landing public route returns the published landing profile", async (t) => {
  const restore = restoreDependencies(landingPublishedRouteDependencies);
  t.after(restore);
  landingPublishedRouteDependencies.landingService.getPublished = async () =>
    cloneFixture(landingProfileFixture);

  const response = await getLandingPublished();

  assert.equal(response.status, 200);
  assert.equal((await response.json()).name, landingProfileFixture.name);
});

test("landing draft route returns the owner's draft and validates patches", async (t) => {
  const restore = restoreDependencies(landingDraftRouteDependencies);
  t.after(restore);

  landingDraftRouteDependencies.requireOwner = async () => {};
  landingDraftRouteDependencies.landingService.getDraft = async () =>
    cloneFixture(landingProfileFixture);
  landingDraftRouteDependencies.landingService.saveDraft = async (patch) => ({
    ...cloneFixture(landingProfileFixture),
    ...patch,
    cards: patch.cards ?? cloneFixture(landingProfileFixture.cards),
  });

  const getResponse = await getLandingDraft();
  assert.equal(getResponse.status, 200);

  const patchResponse = await patchLandingDraft(
    new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headline: "Updated" }),
    }),
  );
  assert.equal(patchResponse.status, 200);
  assert.equal((await patchResponse.json()).headline, "Updated");

  const invalidPatchResponse = await patchLandingDraft(
    new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    }),
  );
  assert.equal(invalidPatchResponse.status, 400);
});

test("landing publish route publishes the draft", async (t) => {
  const restore = restoreDependencies(landingPublishRouteDependencies);
  t.after(restore);

  let publishCalls = 0;
  landingPublishRouteDependencies.requireOwner = async () => {};
  landingPublishRouteDependencies.landingService.publish = async () => {
    publishCalls += 1;
  };

  const response = await postLandingPublish();

  assert.equal(response.status, 200);
  assert.equal(publishCalls, 1);
});
