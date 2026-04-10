import assert from "node:assert/strict";
import test from "node:test";
import { UnauthorizedError } from "@mvp/core";
import {
  GET as getAnalyticsBySlug,
  analyticsProfileRouteDependencies,
} from "../apps/narrative/src/app/api/analytics/[slug]/route";
import {
  POST as postAnalyticsBatch,
  analyticsBatchRouteDependencies,
} from "../apps/narrative/src/app/api/analytics/route";
import {
  POST as postParser,
  parserRouteDependencies,
} from "../apps/narrative/src/app/api/parser/route";
import {
  GET as getDraftProfile,
  PATCH as patchDraftProfile,
  draftProfileRouteDependencies,
} from "../apps/narrative/src/app/api/profile/[slug]/draft/route";
import {
  POST as postPublishProfile,
  publishProfileRouteDependencies,
} from "../apps/narrative/src/app/api/profile/[slug]/publish/route";
import {
  GET as getPublishedProfile,
  publishedProfileRouteDependencies,
} from "../apps/narrative/src/app/api/profile/[slug]/route";
import {
  POST as postTailoring,
  tailoringRouteDependencies,
} from "../apps/narrative/src/app/api/tailoring/route";
import {
  analyticsBatchFixture,
  cloneFixture,
  narrativeProfileFixture,
  parserResultFixture,
  tailoringContextFixture,
} from "./test-fixtures";

function restoreDependencies<TDependencies extends Record<string, unknown>>(
  dependencies: TDependencies,
): () => void {
  const original = { ...dependencies };
  return () => {
    Object.assign(dependencies, original);
  };
}

test("public profile route returns the published profile", async (t) => {
  const restore = restoreDependencies(publishedProfileRouteDependencies);
  t.after(restore);

  publishedProfileRouteDependencies.parseSlugParams = async () => ({
    slug: "ethan",
  });
  publishedProfileRouteDependencies.profileService.getPublishedBySlug =
    async () => cloneFixture(narrativeProfileFixture);

  const response = await getPublishedProfile(new Request("http://localhost"), {
    params: Promise.resolve({ slug: "ethan" }),
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).name, narrativeProfileFixture.name);
});

test("draft profile GET returns the owner's draft", async (t) => {
  const restore = restoreDependencies(draftProfileRouteDependencies);
  t.after(restore);

  draftProfileRouteDependencies.requireOwner = async () => {};
  draftProfileRouteDependencies.parseSlugParams = async () => ({
    slug: "ethan",
  });
  draftProfileRouteDependencies.profileService.getDraftBySlug = async () =>
    cloneFixture(narrativeProfileFixture);

  const response = await getDraftProfile(new Request("http://localhost"), {
    params: Promise.resolve({ slug: "ethan" }),
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).slug, "ethan");
});

test("draft profile PATCH rejects invalid payloads", async (t) => {
  const restore = restoreDependencies(draftProfileRouteDependencies);
  t.after(restore);
  draftProfileRouteDependencies.requireOwner = async () => {};

  const response = await patchDraftProfile(
    new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    }),
    {
      params: Promise.resolve({ slug: "ethan" }),
    },
  );

  assert.equal(response.status, 400);
});

test("publish route publishes the current draft", async (t) => {
  const restore = restoreDependencies(publishProfileRouteDependencies);
  t.after(restore);

  let publishedSlug = "";
  publishProfileRouteDependencies.requireOwner = async () => {};
  publishProfileRouteDependencies.parseSlugParams = async () => ({
    slug: "ethan",
  });
  publishProfileRouteDependencies.publishService.publish = async (slug) => {
    publishedSlug = slug;
  };

  const response = await postPublishProfile(
    new Request("http://localhost", {
      method: "POST",
    }),
    {
      params: Promise.resolve({ slug: "ethan" }),
    },
  );

  assert.equal(response.status, 200);
  assert.equal(publishedSlug, "ethan");
});

test("tailoring route returns a tailored summary", async (t) => {
  const restore = restoreDependencies(tailoringRouteDependencies);
  t.after(restore);

  tailoringRouteDependencies.tailoringService.tailorSummary = async () =>
    "Tailored summary";

  const response = await postTailoring(
    new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: cloneFixture(narrativeProfileFixture),
        context: cloneFixture(tailoringContextFixture),
      }),
    }),
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).summary, "Tailored summary");
});

test("analytics batch route records a session", async (t) => {
  const restore = restoreDependencies(analyticsBatchRouteDependencies);
  t.after(restore);

  analyticsBatchRouteDependencies.analyticsService.recordBatch = async () => ({
    sessionId: "session-1",
  });

  const response = await postAnalyticsBatch(
    new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cloneFixture(analyticsBatchFixture)),
    }),
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).sessionId, "session-1");
});

test("analytics profile route validates date range params", async (t) => {
  const restore = restoreDependencies(analyticsProfileRouteDependencies);
  t.after(restore);
  analyticsProfileRouteDependencies.requireOwner = async () => {};

  const response = await getAnalyticsBySlug(
    new Request("http://localhost/api/analytics/ethan?from=bad&to=bad"),
    { params: Promise.resolve({ slug: "ethan" }) },
  );

  assert.equal(response.status, 400);
});

test("parser route requires owner access and returns parsed content", async (t) => {
  const restore = restoreDependencies(parserRouteDependencies);
  t.after(restore);

  parserRouteDependencies.requireOwner = async () => {};
  parserRouteDependencies.parserService.parseDocument = async () =>
    cloneFixture(parserResultFixture);

  const response = await postParser(
    new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentText: "Resume text",
        fileName: "resume.pdf",
        mimeType: "application/pdf",
      }),
    }),
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).profile.slug, "ethan");

  parserRouteDependencies.requireOwner = async () => {
    throw new UnauthorizedError();
  };

  const unauthorizedResponse = await postParser(
    new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentText: "Resume text",
        fileName: "resume.pdf",
        mimeType: "application/pdf",
      }),
    }),
  );

  assert.equal(unauthorizedResponse.status, 401);
});
