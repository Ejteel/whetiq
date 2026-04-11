import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

const e2eStatePath = resolve(process.cwd(), ".tmp/whetiq-e2e-state.json");
const sharedEnvironment = {
  ...process.env,
  AUTH_GITHUB_ID: "test-github-id",
  AUTH_GITHUB_SECRET: "test-github-secret",
  AUTH_GOOGLE_ID: "test-google-id",
  AUTH_GOOGLE_SECRET: "test-google-secret",
  AUTH_SECRET: "test-auth-secret",
  NARRATIVE_URL: "http://127.0.0.1:3002",
  WHETIQ_E2E_MODE: "1",
  WHETIQ_E2E_STATE_PATH: e2eStatePath,
  WHETIQ_OWNER_EMAIL: "owner@example.com",
  WORKSPACE_URL: "http://127.0.0.1:3003",
};

export default defineConfig({
  globalSetup: "./tests/playwright.global-setup.ts",
  testDir: "./tests",
  testIgnore: ["**/*.test.ts", "**/*.test.mjs", "**/test-fixtures.ts"],
  testMatch: ["**/e2e.spec.ts"],
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run -w @whetiq/narrative dev",
      env: {
        ...sharedEnvironment,
        NEXTAUTH_URL: "http://127.0.0.1:3002/narrative",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:3002/narrative",
    },
    {
      command: "npm run -w @whetiq/landing dev",
      env: {
        ...sharedEnvironment,
        NEXTAUTH_URL: "http://127.0.0.1:3001",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:3001",
    },
  ],
  workers: 1,
});
