import { test } from "@playwright/test";

test("homepage renders both catalog tabs and default saas", async ({ page }) => {
  await page.goto("/");
  const tabs = page.locator("[data-catalog-tab]");
  await test.expect(tabs).toHaveCount(2);
  await test.expect(tabs.first()).toHaveText("Self-hosted");
  await test.expect(tabs.nth(1)).toHaveText("SaaS");

  // saas is the default catalog
  await test.expect(page.locator("[data-catalog-panels=saas]")).toBeVisible();
  await test.expect(page.locator("[data-catalog-panels=selfhosted]")).toBeHidden();
});

test("switching catalog swaps panels and updates the URL", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-catalog-tab="selfhosted"]').click();
  await test.expect(page.locator("[data-catalog-panels=selfhosted]")).toBeVisible();
  await test.expect(page.locator("[data-catalog-panels=saas]")).toBeHidden();
  await test.expect(page).toHaveURL(/\?catalog=selfhosted/);
});

test("search filters entries by name", async ({ page }) => {
  await page.goto("/");
  await page.fill("#q", "neon");
  // Neon lives in the saas catalog (default active)
  const neonRow = page.locator('[data-entry]').filter({ hasText: "Neon" }).first();
  await test.expect(neonRow).toBeVisible();
  await test.expect(page.locator("[data-catalog-panels=saas]")).toContainText("Neon");
});

test("empty search shows the empty state", async ({ page }) => {
  await page.goto("/");
  await page.fill("#q", "zzzz-no-such-entry");
  await test.expect(page.locator("#empty")).toBeVisible();
});