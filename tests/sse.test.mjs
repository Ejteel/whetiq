import assert from "node:assert/strict";
import test from "node:test";
import { iterateSSE } from "../packages/adapters/dist/sse.js";

test("iterateSSE yields parsed events from an SSE response", async () => {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("event: delta\ndata: first\n\n"));
      controller.enqueue(encoder.encode("event: final\ndata: second\n\n"));
      controller.close();
    }
  });
  const response = new Response(body);
  const events = [];

  for await (const event of iterateSSE(response)) {
    events.push(event);
  }

  assert.deepEqual(events, [
    { event: "delta", data: "first" },
    { event: "final", data: "second" }
  ]);
});
