import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

const ownerStorageStatePath = resolve(
  process.cwd(),
  ".tmp/owner-storage-state.json",
);

test("visitor loads /", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Ethan J. Teel" }),
  ).toBeVisible();
  await expect(page.getByText("Career Narrative")).toBeVisible();
});

test("owner entry is reachable on landing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Owner access" }).click();

  await expect(
    page.getByRole("heading", { name: "Sign in to edit this landing hub" }),
  ).toBeVisible();
});

test("visitor loads /narrative", async ({ page }) => {
  await page.goto("/narrative");

  await page.waitForURL(/\/narrative\/ethan$/);
  await expect(
    page.getByRole("heading", { name: "Ethan J. Teel" }),
  ).toBeVisible();
});

test.describe("owner mode", () => {
  test.use({ storageState: ownerStorageStatePath });

  test("authenticated owner sees edit mode on landing", async ({ page }) => {
    await page.goto("/?edit=owner");

    await expect(
      page.getByRole("button", { name: "Preview Draft as Visitor" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
  });

  test("authenticated owner still sees the public landing page at root", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Owner access" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Preview Draft as Visitor" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);
  });

  test("authenticated owner sees edit mode on narrative", async ({ page }) => {
    await page.goto("/narrative");

    await page.waitForURL(/\/narrative\/ethan$/);
    await expect(
      page.getByRole("button", { name: "Preview as Visitor" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
  });

  test("publish flow works end to end", async ({ page }) => {
    await page.goto("/?edit=owner");
    const landingHeadlineInput = page.locator("input.landing-headline");
    await landingHeadlineInput.fill("Published from Playwright");
    await landingHeadlineInput.blur();
    const landingPublishButton = page.getByRole("button", { name: "Publish" });
    await expect(landingPublishButton).toBeEnabled();
    await landingPublishButton.click();
    await expect(
      page.getByRole("button", { name: "Return to Editing" }),
    ).toBeVisible();
    await expect(page.getByText("Published from Playwright")).toBeVisible();
  });
});
