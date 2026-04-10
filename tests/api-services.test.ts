import assert from "node:assert/strict";
import test from "node:test";
import { generateTailoredNarrativeSummary } from "../packages/api/src/services/narrative-tailoring";
import { parseNarrativeProfileDocument } from "../packages/api/src/services/narrative-parser";
import {
  cloneFixture,
  narrativeProfileFixture,
  tailoringContextFixture,
} from "./test-fixtures";

test("parseNarrativeProfileDocument maps text blocks into profile structure", async () => {
  const result = await parseNarrativeProfileDocument({
    documentText: [
      "Ethan J. Teel",
      "Austin, TX",
      "Product Strategy Lead",
      "WhetIQ",
      "Built narrative systems",
      "MBA Candidate",
      "University of Texas",
      "Strategy concentration",
    ].join("\n"),
    fileName: "resume.pdf",
    mimeType: "application/pdf",
  });

  assert.equal(result.profile.name, "Ethan J. Teel");
  assert.equal(result.profile.timeline.length, 2);
  assert.equal(result.profile.timeline[1]?.track, "education");
});

test("generateTailoredNarrativeSummary returns a serialized tailoring prompt", async () => {
  const summary = await generateTailoredNarrativeSummary(
    cloneFixture(narrativeProfileFixture),
    cloneFixture(tailoringContextFixture),
  );

  assert.match(summary, /Profile: Ethan J. Teel/);
  assert.match(summary, /REQUEST_PAYLOAD:/);
});
