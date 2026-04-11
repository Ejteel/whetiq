import assert from "node:assert/strict";
import test from "node:test";
import { LandingRepository } from "../apps/landing/src/repositories/landing.repository";
import { cloneFixture, landingProfileFixture } from "./test-fixtures";

function createLandingDbStub(options: {
  selectRows?: Array<{ data: unknown }[]>;
  updateRows?: Array<{ id: string }[]>;
}) {
  const selectRows = [...(options.selectRows ?? [])];
  const updateRows = [...(options.updateRows ?? [])];
  const insertedValues: unknown[] = [];

  return {
    insertedValues,
    db: {
      insert() {
        return {
          values(value: unknown) {
            insertedValues.push(value);
            return {
              async onConflictDoNothing() {},
            };
          },
        };
      },
      select() {
        return {
          from() {
            return {
              where() {
                return {
                  limit: async () => selectRows.shift() ?? [],
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
    },
  };
}

test("LandingRepository returns draft and published data when present", async () => {
  const repository = new LandingRepository(
    () =>
      createLandingDbStub({
        selectRows: [
          [{ data: cloneFixture(landingProfileFixture) }],
          [{ data: cloneFixture(landingProfileFixture) }],
        ],
      }).db as never,
  );

  const draft = await repository.getDraft();
  const published = await repository.getPublished();

  assert.equal(draft.name, landingProfileFixture.name);
  assert.equal(published.name, landingProfileFixture.name);
});

test("LandingRepository seeds versions when they do not exist", async () => {
  const harness = createLandingDbStub({
    selectRows: [[], [{ data: cloneFixture(landingProfileFixture) }]],
  });
  const repository = new LandingRepository(() => harness.db as never);

  const profile = await repository.getDraft();

  assert.equal(profile.name, landingProfileFixture.name);
  assert.equal(harness.insertedValues.length, 1);
});

test("LandingRepository.saveDraft and publish retry after seeding", async () => {
  const harness = createLandingDbStub({
    selectRows: [
      [{ data: cloneFixture(landingProfileFixture) }],
      [{ data: cloneFixture(landingProfileFixture) }],
    ],
    updateRows: [[], [{ id: "draft-1" }], [], [{ id: "published-1" }]],
  });
  const repository = new LandingRepository(() => harness.db as never);

  await repository.saveDraft(cloneFixture(landingProfileFixture));
  await repository.publish();

  assert.equal(harness.insertedValues.length, 2);
});
