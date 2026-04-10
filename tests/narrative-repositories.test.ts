import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { ResourceNotFoundError } from "@mvp/core";
import { AnalyticsRepository } from "../apps/narrative/src/repositories/analytics.repository";
import { ProfileRepository } from "../apps/narrative/src/repositories/profile.repository";
import {
  analyticsEventFixture,
  analyticsSessionFixture,
  cloneFixture,
  narrativeProfileFixture,
} from "./test-fixtures";

function createProfileDbStub(options: {
  profileIdRows?: Array<{ profileId: string }[]>;
  versionRows?: Array<{ data: unknown }[]>;
  updateRows?: Array<{ id: string }[]>;
}) {
  const profileIdRows = [...(options.profileIdRows ?? [])];
  const versionRows = [...(options.versionRows ?? [])];
  const updateRows = [...(options.updateRows ?? [])];

  return {
    select(selection: unknown) {
      if (
        typeof selection === "object" &&
        selection !== null &&
        "profileId" in selection
      ) {
        return {
          from() {
            return {
              where() {
                return {
                  orderBy() {
                    return {
                      limit: async () => profileIdRows.shift() ?? [],
                    };
                  },
                  limit: async () => profileIdRows.shift() ?? [],
                };
              },
            };
          },
        };
      }

      return {
        from() {
          return {
            where() {
              return {
                orderBy() {
                  return {
                    limit: async () => versionRows.shift() ?? [],
                  };
                },
              };
            },
          };
        },
      };
    },
    update() {
      return {
        set() {
          return {
            where() {
              return {
                returning: async () => updateRows.shift() ?? [],
              };
            },
          };
        },
      };
    },
  };
}

function createAnalyticsDbStub(options: {
  profileRows?: Array<{ profileId: string }[]>;
  sessionRows?: Array<Record<string, unknown>[]>;
}) {
  const profileRows = [...(options.profileRows ?? [])];
  const sessionRows = [...(options.sessionRows ?? [])];
  const insertedValues: unknown[] = [];

  return {
    insertedValues,
    db: {
      insert() {
        return {
          async values(value: unknown) {
            insertedValues.push(value);
          },
        };
      },
      select(selection: unknown) {
        if (
          typeof selection === "object" &&
          selection !== null &&
          "profileId" in selection &&
          Object.keys(selection as Record<string, unknown>).length === 1
        ) {
          return {
            from() {
              return {
                where() {
                  return {
                    limit: async () => profileRows.shift() ?? [],
                  };
                },
              };
            },
          };
        }

        return {
          from() {
            return {
              where() {
                return sessionRows.shift() ?? [];
              },
            };
          },
        };
      },
    },
  };
}

test("ProfileRepository returns draft and published profiles", async () => {
  const repository = new ProfileRepository(
    () =>
      createProfileDbStub({
        versionRows: [
          [{ data: cloneFixture(narrativeProfileFixture) }],
          [{ data: cloneFixture(narrativeProfileFixture) }],
        ],
      }) as never,
  );

  const draft = await repository.getDraft("profile-ethan");
  const published = await repository.getPublished("profile-ethan");

  assert.equal(draft.slug, "ethan");
  assert.equal(published.slug, "ethan");
});

test("ProfileRepository resolves profile versions by slug", async () => {
  const repository = new ProfileRepository(
    () =>
      createProfileDbStub({
        profileIdRows: [[{ profileId: narrativeProfileFixture.id }]],
        versionRows: [[{ data: cloneFixture(narrativeProfileFixture) }]],
      }) as never,
  );

  const profile = await repository.getPublishedBySlug("ethan");

  assert.equal(profile.id, narrativeProfileFixture.id);
});

test("ProfileRepository.saveDraft and publish throw when records are missing", async () => {
  const repository = new ProfileRepository(
    () =>
      createProfileDbStub({
        updateRows: [[], []],
        versionRows: [[{ data: cloneFixture(narrativeProfileFixture) }]],
      }) as never,
  );

  await assert.rejects(
    () =>
      repository.saveDraft("missing", cloneFixture(narrativeProfileFixture)),
    ResourceNotFoundError,
  );
  await assert.rejects(
    () => repository.publish("missing"),
    ResourceNotFoundError,
  );
});

test("AnalyticsRepository creates sessions, records events, and looks up sessions by slug", async () => {
  const randomUuidMock = mock.method(crypto, "randomUUID", () => "session-1");
  const harness = createAnalyticsDbStub({
    profileRows: [[{ profileId: narrativeProfileFixture.id }]],
    sessionRows: [[cloneFixture(analyticsSessionFixture)]],
  });
  const repository = new AnalyticsRepository(() => harness.db as never);

  const sessionId = await repository.createSession(
    cloneFixture(analyticsSessionFixture),
  );
  await repository.recordEvents("session-1", [
    cloneFixture(analyticsEventFixture),
  ]);
  const sessions = await repository.getSessionsByProfileSlug(
    "ethan",
    new Date("2026-04-01T00:00:00.000Z"),
    new Date("2026-04-30T23:59:59.000Z"),
  );

  assert.equal(sessionId, "session-1");
  assert.equal(harness.insertedValues.length, 2);
  assert.equal(sessions.length, 1);

  randomUuidMock.mock.restore();
});

test("AnalyticsRepository skips insert work when no events are provided", async () => {
  const harness = createAnalyticsDbStub({});
  const repository = new AnalyticsRepository(() => harness.db as never);

  await repository.recordEvents("session-1", []);

  assert.equal(harness.insertedValues.length, 0);
});
