#!/usr/bin/env node

import process from "node:process";

const required = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY"];
const nodeMajor = Number(process.versions.node.split(".")[0]);

let failed = false;

if (Number.isNaN(nodeMajor) || nodeMajor < 20) {
  console.error(`✗ Node.js 20+ is required. Detected: ${process.versions.node}`);
  failed = true;
} else {
  console.log(`✓ Node.js version OK: ${process.versions.node}`);
}

const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.warn("! Missing API keys (set these in your shell or .env.local):");
  for (const key of missing) {
    console.warn(`  - ${key}`);
  }
  console.warn("  You can still run the UI without keys, but provider calls will fail.");
} else {
  console.log("✓ Provider API keys detected in environment.");
}

if (failed) {
  process.exit(1);
}
