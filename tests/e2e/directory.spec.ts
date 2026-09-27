import { test } from "@playwright/test";

test("homepage renders all catalogs and defaults to SaaS", async ({ page }) => {
  await page.goto("/");
  await test.expect(page).toHaveURL(/\/([?]catalog=saas)?$/);
  await test.expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  const tabs = page.locator("[data-catalog-tab]");
  await test.expect(tabs).toHaveCount(3);
  await test.expect(tabs.nth(0)).toHaveText("SaaS");
  await test.expect(tabs.nth(1)).toHaveText("APIs");
  await test.expect(tabs.nth(2)).toHaveText("LLM & AI");

  // saas is the default catalog
  await test.expect(page.locator("[data-catalog-panels=saas]")).toBeVisible();
  await test.expect(page.locator("[data-catalog-panels=apis]")).toBeHidden();
});

test("switching catalog swaps panels and updates the URL", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-catalog-tab="apis"]').click();
  await test.expect(page.locator("[data-catalog-panels=apis]")).toBeVisible();
  await test.expect(page.locator("[data-catalog-panels=saas]")).toBeHidden();
  await test.expect(page).toHaveURL(/\?catalog=apis/);
});

test("need links restore category and commercial filters", async ({ page }) => {
  await page.goto("/?need=hosting&commercial=yes#directory");
  await test.expect(page.locator('[data-catalog-tab="saas"]')).toHaveAttribute("aria-pressed", "true");
  await test.expect(page.locator('[data-category-chip="hosting"]')).toHaveAttribute("aria-pressed", "true");
  await test.expect(page.locator("#commercial-note")).toBeVisible();
  await test.expect(page.locator("#active-constraints")).toContainText("Hosting");
});

test("search in the URL restores the search field and results", async ({ page }) => {
  await page.goto("/?q=neon");
  await test.expect(page.locator("#q")).toHaveValue("neon");
  await test.expect(page.locator('[data-entry]').filter({ hasText: "Neon" }).first()).toBeVisible();
  await test.expect(page.locator("#count")).toContainText(/^[1-9]\d* entr(y|ies)$/);
});

test("multiple selected categories survive a shared URL reload", async ({ page }) => {
  await page.goto("/?need=hosting#directory");
  await page.locator("#filters-toggle").click();
  await page.locator('[data-category-chip="databases"]').click();

  await test.expect.poll(() => new URL(page.url()).searchParams.getAll("category")).toEqual([
    "hosting",
    "databases",
  ]);

  await page.reload();
  await page.locator("#filters-toggle").click();
  await test.expect(page.locator('[data-category-chip="hosting"]')).toHaveAttribute("aria-pressed", "true");
  await test.expect(page.locator('[data-category-chip="databases"]')).toHaveAttribute("aria-pressed", "true");
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
