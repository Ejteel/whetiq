#!/usr/bin/env node

import process from "node:process";

const required = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY"];
const nodeMajor = Number(process.versions.node.split(".")[0]);
const authMode = process.env.PREVIEW_AUTH_MODE ?? "none";
const hosted = process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production";
const publicDemo = process.env.DEMO_MODE === "true" && process.env.PUBLIC_DEMO === "true";

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

if (hosted && authMode === "none" && !publicDemo) {
  console.warn("! Hosted deployment with PREVIEW_AUTH_MODE=none is not recommended.");
  console.warn("  Use PREVIEW_AUTH_MODE=oauth or set DEMO_MODE=true and PUBLIC_DEMO=true for public demos.");
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
  const hasGitHub = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const missingOAuth = [];
  if (!hasSecret) {
    missingOAuth.unshift("AUTH_SECRET or NEXTAUTH_SECRET");
  }
  if (!process.env.NEXTAUTH_URL && hosted) {
    missingOAuth.unshift("NEXTAUTH_URL");
  }
  if (!hasGitHub && !hasGoogle) {
    missingOAuth.push("AUTH_GITHUB_ID + AUTH_GITHUB_SECRET or AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET");
  }
  if (missingOAuth.length) {
    console.warn("! PREVIEW_AUTH_MODE=oauth but missing:");
    for (const key of missingOAuth) {
      console.warn(`  - ${key}`);
    }
  } else {
    const providers = [hasGitHub ? "GitHub" : null, hasGoogle ? "Google" : null].filter(Boolean).join(", ");
    console.log(`✓ OAuth auth variables detected (${providers}).`);
  }

  const hasAllowlist = Boolean(process.env.ALLOWED_EMAILS || process.env.ALLOWED_DOMAINS);
  if (!hasAllowlist) {
    console.warn("! OAuth is enabled without ALLOWED_EMAILS/ALLOWED_DOMAINS.");
    console.warn("  Any authenticated OAuth user will be allowed into private workspace.");
  } else {
    console.log("✓ OAuth allowlist configured (ALLOWED_EMAILS and/or ALLOWED_DOMAINS).");
  }
}

if (failed) {
  process.exit(1);
}
