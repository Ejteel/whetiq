#!/usr/bin/env node

import process from "node:process";

const required = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY"];
const nodeMajor = Number(process.versions.node.split(".")[0]);
const authMode = process.env.PREVIEW_AUTH_MODE ?? "none";

let failed = false;

if (Number.isNaN(nodeMajor) || nodeMajor < 20) {
  console.error(`✗ Node.js 20+ is required. Detected: ${process.versions.node}`);
  failed = true;
} else {
  console.log(`✓ Node.js version OK: ${process.versions.node}`);
}

if (process.env.DEMO_MODE === "true") {
  console.log("✓ DEMO_MODE=true, provider API keys are not required.");
} else {
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
}

if (!["none", "basic", "oauth"].includes(authMode)) {
  console.error(`✗ PREVIEW_AUTH_MODE must be one of: none, basic, oauth. Detected: ${authMode}`);
  failed = true;
}

if (authMode === "basic") {
  const missingBasic = ["PREVIEW_AUTH_USERNAME", "PREVIEW_AUTH_PASSWORD"].filter((name) => !process.env[name]);
  if (missingBasic.length) {
    console.warn("! PREVIEW_AUTH_MODE=basic but missing:");
    for (const key of missingBasic) {
      console.warn(`  - ${key}`);
    }
  } else {
    console.log("✓ Basic preview auth variables detected.");
  }
}

if (authMode === "oauth") {
  const hasSecret = Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET);
  const missingOAuth = ["AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET"].filter((name) => !process.env[name]);
  if (!hasSecret) {
    missingOAuth.unshift("AUTH_SECRET or NEXTAUTH_SECRET");
  }
  if (missingOAuth.length) {
    console.warn("! PREVIEW_AUTH_MODE=oauth but missing:");
    for (const key of missingOAuth) {
      console.warn(`  - ${key}`);
    }
  } else {
    console.log("✓ OAuth auth variables detected.");
  }
}

if (failed) {
  process.exit(1);
}
