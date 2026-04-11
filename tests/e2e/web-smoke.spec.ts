import { expect, test } from "@playwright/test";

const webBase = process.env.WEB_BASE_URL ?? "https://whetiq.com";

async function assertReachable(base: string): Promise<void> {
  const response = await fetch(base, { method: "GET" });
  if (!response.ok) {
    throw new Error(
      `WEB_BASE_URL is not reachable: ${base}. Override WEB_BASE_URL for local runs (example: http://127.0.0.1:3001).`
    );
  }
}

test.describe("whetiq web smoke", () => {
  test.beforeAll(async () => {
    await assertReachable(webBase);
  });

  test("landing, demo, and private entry flow are wired correctly", async ({ page }) => {
    await page.goto(`${webBase}/`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.getByRole("link", { name: "Open Demo Workspace" }).click();
    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByText("Demo Workspace (public)")).toBeVisible();

    await page.goto(`${webBase}/`);
    await page.getByRole("link", { name: /Sign In for Private Workspace|Enter Private Workspace/ }).click();
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fprivate-workspace/);
    await expect(page.getByRole("heading", { name: /Sign in to/i })).toBeVisible();
  });

  test("login screen handles provider availability without crashing", async ({ page, request }) => {
    const providersResponse = await request.get(`${webBase}/api/auth/providers`);
    expect(providersResponse.ok()).toBeTruthy();
    const providers = (await providersResponse.json()) as Record<string, unknown>;

    await page.goto(`${webBase}/login?callbackUrl=%2Fprivate-workspace`);
    await expect(page.getByRole("heading", { name: /Sign in to/i })).toBeVisible();

    const hasGitHub = Boolean(providers.github);
    const hasGoogle = Boolean(providers.google);

    if (hasGitHub) {
      await expect(page.getByRole("button", { name: "Continue with GitHub" })).toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: "Continue with GitHub" })).toHaveCount(0);
    }

    if (hasGoogle) {
      await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
    }

    if (!hasGitHub && !hasGoogle) {
      await expect(page.getByText("No OAuth providers configured for this deployment.")).toBeVisible();
    }
  });

  test("chat keeps latest messages visible and supports jump-to-latest when user scrolls up", async ({ page }) => {
    await page.goto(`${webBase}/workspace`);
    const thread = page.getByTestId("thread-body");

    for (let i = 0; i < 9; i++) {
      await page.getByPlaceholder("Ask your question...").fill(`Scroll verification message ${i + 1}`);
      await page.getByRole("button", { name: "Send" }).click();
      await expect(page.getByRole("button", { name: "Send" })).toBeEnabled();
    }

    const atBottom = await thread.evaluate((el) => el.scrollHeight - (el.scrollTop + el.clientHeight));
    expect(atBottom).toBeLessThan(80);

    await thread.evaluate((el) => {
      el.scrollTop = 0;
      el.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    await page.getByPlaceholder("Ask your question...").fill("message while reading history");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByRole("button", { name: "Send" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Jump to latest" })).toBeVisible();

    await page.getByRole("button", { name: "Jump to latest" }).click();
    const afterJump = await thread.evaluate((el) => el.scrollHeight - (el.scrollTop + el.clientHeight));
    expect(afterJump).toBeLessThan(80);
  });
});
