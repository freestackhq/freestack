import { test } from "@playwright/test";

test("catalog page renders all catalogs and defaults to SaaS", async ({ page }) => {
  await page.goto("/catalogs");
  await test.expect(page).toHaveURL(/\/catalogs\/?(?:\?catalog=saas)?$/);
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

test("homepage presents three clear paths and keeps the full directory separate", async ({ page }) => {
  await page.goto("/");
  await test.expect(page.getByRole("heading", { name: "Choose the right free tool." })).toBeVisible();
  await test.expect(page.locator('a[href^="/guides/"]')).toHaveCount(3);
  await test.expect(page.getByRole("link", { name: /Browse tools/ })).toHaveAttribute("href", "/catalogs");
  await test.expect(page.locator("#filters")).toHaveCount(0);
});

test("audience paths lead to the right guide and working catalog entry points", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: /Launch a lean MVP/ }).click();
  await test.expect(page).toHaveURL(/\/guides\/startup\/?$/);
  await test.expect(page.getByRole("link", { name: /commercial hosting options/ })).toHaveAttribute(
    "href",
    /need=hosting.*commercial=yes/,
  );

  await page.goto("/");
  await page.getByRole("link", { name: /Publish a portfolio project/ }).click();
  await test.expect(page).toHaveURL(/\/guides\/portfolio\/?$/);
  await page.getByRole("link", { name: /compare hosting options/ }).click();
  await test.expect(page).toHaveURL(/\/catalogs\/?\?need=hosting.*#directory$/);
  await test.expect(page.locator('[data-category-chip="hosting"]')).toHaveAttribute("aria-pressed", "true");

  await page.goto("/");
  await page.getByRole("link", { name: /Pick cloud or self-hosted/ }).click();
  await test.expect(page).toHaveURL(/\/guides\/hobby\/?$/);
  await page.getByRole("link", { name: /Find self-hostable services/ }).click();
  await test.expect(page).toHaveURL(/\/catalogs\/?\?catalog=saas&q=self-host#directory$/);
  await test.expect(page.locator("#q")).toHaveValue("self-host");
  await test.expect(page.locator('[data-entry]:not(.is-hidden)').first()).toBeVisible();
});

test("mobile menu stays focused on the three primary destinations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const toggle = page.getByRole("button", { name: "Open menu" });
  const drawer = page.locator("#mobile-nav");
  await test.expect(page.locator("#paths > h2")).toHaveText("What are you trying to do?");
  await test.expect(page.locator('a[href^="/guides/"]')).toHaveCount(3);

  await toggle.click();
  await test.expect(toggle).toHaveAttribute("aria-expanded", "true");
  await test.expect(drawer).toHaveAttribute("aria-hidden", "false");
  await page.keyboard.press("Escape");
  await test.expect(toggle).toHaveAttribute("aria-expanded", "false");
  await test.expect(drawer).toHaveAttribute("aria-hidden", "true");
});

test("switching catalog swaps panels and updates the URL", async ({ page }) => {
  await page.goto("/catalogs");
  await page.locator('[data-catalog-tab="apis"]').click();
  await test.expect(page.locator("[data-catalog-panels=apis]")).toBeVisible();
  await test.expect(page.locator("[data-catalog-panels=saas]")).toBeHidden();
  await test.expect(page).toHaveURL(/\?catalog=apis/);
});

test("need links restore category and commercial filters", async ({ page }) => {
  await page.goto("/catalogs/?need=hosting&commercial=yes#directory");
  await test.expect(page.locator('[data-catalog-tab="saas"]')).toHaveAttribute("aria-pressed", "true");
  await test.expect(page.locator('[data-category-chip="hosting"]')).toHaveAttribute("aria-pressed", "true");
  await test.expect(page.locator("#commercial-note")).toBeVisible();
  await test.expect(page.locator("#active-constraints")).toContainText("Hosting");
});

test("search in the URL restores the search field and results", async ({ page }) => {
  await page.goto("/catalogs/?q=neon");
  await test.expect(page.locator("#q")).toHaveValue("neon");
  await test.expect(page.locator('[data-entry]').filter({ hasText: "Neon" }).first()).toBeVisible();
  await test.expect(page.locator("#count")).toContainText(/^[1-9]\d* entr(y|ies)$/);
});

test("multiple selected categories survive a shared URL reload", async ({ page }) => {
  await page.goto("/catalogs/?need=hosting#directory");
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
  await page.goto("/catalogs");
  await page.fill("#q", "neon");
  // Neon lives in the saas catalog (default active)
  const neonRow = page.locator('[data-entry]').filter({ hasText: "Neon" }).first();
  await test.expect(neonRow).toBeVisible();
  await test.expect(page.locator("[data-catalog-panels=saas]")).toContainText("Neon");
});

test("empty search shows the empty state", async ({ page }) => {
  await page.goto("/catalogs");
  await page.fill("#q", "zzzz-no-such-entry");
  await test.expect(page.locator("#empty")).toBeVisible();
});
