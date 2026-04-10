import assert from "node:assert/strict";
import test from "node:test";
import type { IAnalyticsRepository, IProfileRepository } from "@mvp/storage";
import { AnalyticsService } from "../apps/narrative/src/services/analytics.service";
import { ParserService } from "../apps/narrative/src/services/parser.service";
import { ProfileService } from "../apps/narrative/src/services/profile.service";
import { PublishService } from "../apps/narrative/src/services/publish.service";
import { TailoringService } from "../apps/narrative/src/services/tailoring.service";
import {
  analyticsBatchFixture,
  analyticsEventFixture,
  analyticsSessionFixture,
  cloneFixture,
  narrativeProfileFixture,
  parserResultFixture,
  tailoringContextFixture,
} from "./test-fixtures";

function createProfileRepositoryStub(): IProfileRepository {
  const profile = cloneFixture(narrativeProfileFixture);

  return {
    async getDraft() {
      return profile;
    },
    async getPublished() {
      return profile;
    },
    async getDraftBySlug() {
      return profile;
    },
    async getPublishedBySlug() {
      return profile;
    },
    async publish() {},
    async saveDraft() {},
  };
}

test("ProfileService delegates published and draft lookup by slug", async () => {
  const calls: string[] = [];
  const repository: IProfileRepository = {
    ...createProfileRepositoryStub(),
    async getDraftBySlug(slug) {
      calls.push(`draft:${slug}`);
      return cloneFixture(narrativeProfileFixture);
    },
    async getPublishedBySlug(slug) {
      calls.push(`published:${slug}`);
      return cloneFixture(narrativeProfileFixture);
    },
  };
  const service = new ProfileService(repository);

  await service.getPublishedBySlug("ethan");
  await service.getDraftBySlug("ethan");

  assert.deepEqual(calls, ["published:ethan", "draft:ethan"]);
});

test("ProfileService.saveDraft merges nested summary and timeline data", async () => {
  const saved: { profileId: string; data: typeof narrativeProfileFixture }[] =
    [];
  const repository: IProfileRepository = {
    ...createProfileRepositoryStub(),
    async getDraftBySlug() {
      return cloneFixture(narrativeProfileFixture);
    },
    async saveDraft(profileId, data) {
      saved.push({ profileId, data });
    },
  };
  const service = new ProfileService(repository);

  const result = await service.saveDraft("ethan", {
    summary: { fallback: "Updated summary" },
    timeline: [
      {
        ...cloneFixture(narrativeProfileFixture.timeline[0]),
        role: "Chief of Staff",
      },
    ],
  });

  assert.equal(result.summary.fallback, "Updated summary");
  assert.equal(result.summary.contextSummaries.length, 1);
  assert.equal(result.timeline[0]?.role, "Chief of Staff");
  assert.equal(saved[0]?.profileId, narrativeProfileFixture.id);
});

test("PublishService publishes the current draft by profile id", async () => {
  const calls: string[] = [];
  const repository: IProfileRepository = {
    ...createProfileRepositoryStub(),
    async getDraftBySlug() {
      calls.push("getDraftBySlug");
      return cloneFixture(narrativeProfileFixture);
    },
    async publish(profileId) {
      calls.push(`publish:${profileId}`);
    },
  };
  const service = new PublishService(repository);

  await service.publish("ethan");

  assert.deepEqual(calls, [
    "getDraftBySlug",
    `publish:${narrativeProfileFixture.id}`,
  ]);
});

test("ParserService forwards document inputs to the parser dependency", async () => {
  let receivedFileName = "";
  const service = new ParserService(async (input) => {
    receivedFileName = input.fileName;
    return cloneFixture(parserResultFixture);
  });

  const result = await service.parseDocument(
    "resume text",
    "resume.pdf",
    "application/pdf",
  );

  assert.equal(receivedFileName, "resume.pdf");
  assert.equal(result.profile.name, narrativeProfileFixture.name);
});

test("TailoringService forwards profile and context to the tailoring dependency", async () => {
  let receivedCompany = "";
  const service = new TailoringService(async (_profile, context) => {
    receivedCompany = context.company ?? "";
    return "Tailored summary";
  });

  const summary = await service.tailorSummary(
    cloneFixture(narrativeProfileFixture),
    cloneFixture(tailoringContextFixture),
  );

  assert.equal(receivedCompany, "Acme");
  assert.equal(summary, "Tailored summary");
});

test("AnalyticsService.recordBatch creates a session when one is not supplied", async () => {
  const recordedEvents: (typeof analyticsEventFixture)[] = [];
  const repository: IAnalyticsRepository = {
    async createSession() {
      return "session-1";
    },
    async getSessionsByProfile() {
      return [];
    },
    async getSessionsByProfileSlug() {
      return [];
    },
    async recordEvents(_sessionId, events) {
      recordedEvents.push(...events);
    },
  };
  const service = new AnalyticsService(repository);

  const result = await service.recordBatch(cloneFixture(analyticsBatchFixture));

  assert.equal(result.sessionId, "session-1");
  assert.equal(recordedEvents[0]?.sessionId, "session-1");
  assert.equal(recordedEvents[0]?.sequenceNumber, 0);
});

test("AnalyticsService.recordBatch reuses an existing session id", async () => {
  let createSessionCalls = 0;
  const repository: IAnalyticsRepository = {
    async createSession() {
      createSessionCalls += 1;
      return "unused";
    },
    async getSessionsByProfile() {
      return [];
    },
    async getSessionsByProfileSlug() {
      return [];
    },
    async recordEvents(sessionId) {
      assert.equal(sessionId, "session-existing");
    },
  };
  const service = new AnalyticsService(repository);

  const result = await service.recordBatch({
    ...cloneFixture(analyticsBatchFixture),
    sessionId: "session-existing",
  });

  assert.equal(result.sessionId, "session-existing");
  assert.equal(createSessionCalls, 0);
});

test("AnalyticsService.getProfileAnalytics summarizes sessions by device and referrer", async () => {
  const repository: IAnalyticsRepository = {
    async createSession() {
      return "unused";
    },
    async getSessionsByProfile() {
      return [];
    },
    async getSessionsByProfileSlug() {
      return [
        cloneFixture(analyticsSessionFixture),
        {
          ...cloneFixture(analyticsSessionFixture),
          deviceType: "mobile",
          referrer: null,
          createdAt: new Date("2026-04-11T08:00:00.000Z"),
        },
      ];
    },
    async recordEvents() {},
  };
  const service = new AnalyticsService(repository);

  const summary = await service.getProfileAnalytics(
    "ethan",
    new Date("2026-04-01T00:00:00.000Z"),
    new Date("2026-04-30T23:59:59.000Z"),
  );

  assert.equal(summary.totalSessions, 2);
  assert.equal(summary.byDeviceType.desktop, 1);
  assert.equal(summary.byDeviceType.mobile, 1);
  assert.equal(summary.byReferrer[0]?.label, "www.linkedin.com");
  assert.equal(summary.latestVisitAt, "2026-04-11T08:00:00.000Z");
});
