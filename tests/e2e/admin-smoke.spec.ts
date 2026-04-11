import { expect, test } from "@playwright/test";

const adminBase = process.env.ADMIN_BASE_URL ?? "https://admin.whetiq.com";

async function assertReachable(base: string): Promise<void> {
  const response = await fetch(base, { method: "GET" });
  if (!response.ok) {
    throw new Error(
      `ADMIN_BASE_URL is not reachable: ${base}. Override ADMIN_BASE_URL for local runs (example: http://127.0.0.1:3010).`
    );
  }
}

test.describe("admin control plane smoke", () => {
  test.beforeAll(async () => {
    await assertReachable(adminBase);
  });

  test("admin login shell renders", async ({ page }) => {
    await page.goto(`${adminBase}/`);
    await expect(page.getByRole("heading", { name: /Control Plane/i })).toBeVisible();
  });

  test("provider buttons mirror NextAuth provider availability", async ({ page, request }) => {
    const providersResponse = await request.get(`${adminBase}/api/auth/providers`);
    expect(providersResponse.ok()).toBeTruthy();
    const providers = (await providersResponse.json()) as Record<string, unknown>;

    await page.goto(`${adminBase}/`);

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
  });
});
