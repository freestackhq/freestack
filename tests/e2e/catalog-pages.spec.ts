import { test } from "@playwright/test";

test("catalogs index lists all catalogs with entry counts", async ({ page }) => {
  await page.goto("/catalogs");
  await test.expect(page.getByRole("heading", { name: "catalogs." })).toBeVisible();
  await test.expect(page.getByRole("heading", { name: "SaaS" })).toBeVisible();
  await test.expect(page.getByRole("heading", { name: "APIs" })).toBeVisible();
  await test.expect(page.getByRole("heading", { name: "LLM & AI" })).toBeVisible();
  await test.expect(page.locator("text=/entries/").first()).toBeVisible();
});

test("catalog index shows categories", async ({ page }) => {
  await page.goto("/catalogs/apis");
  await test.expect(page.getByRole("heading", { name: /APIs\./ })).toBeVisible();
  await test.expect(page.getByRole("heading", { name: "Weather" })).toBeVisible();
  await test.expect(page.getByRole("heading", { name: "Geolocation" })).toBeVisible();
});

test("category page renders comparison matrix and entry rows", async ({ page }) => {
  await page.goto("/catalogs/apis/weather");
  await test.expect(page.getByRole("heading", { name: /Weather\./ })).toBeVisible();
  // matrix table
  await test.expect(page.locator("table")).toBeVisible();
  await test.expect(page.locator("table").getByText("Open-Meteo").first()).toBeVisible();
  // entry list links to detail
  const link = page.locator('a[href="/catalogs/apis/weather/open-meteo"]').first();
  await test.expect(link).toBeVisible();
});

test("entry page renders fields, pick, and alternatives", async ({ page }) => {
  await page.goto("/catalogs/apis/weather/open-meteo");
  await test.expect(page.getByRole("heading", { name: /Open-Meteo\./ })).toBeVisible();
  await test.expect(page.getByText("Pick this if")).toBeVisible();
  await test.expect(page.getByText("https://open-meteo.com/en/docs").first()).toBeVisible();
  // alternatives block
  await test.expect(page.getByText("How it compares")).toBeVisible();
  await test.expect(page.getByText("OpenWeatherMap", { exact: false }).first()).toBeVisible();
});

test("saas category renders from converted markdown", async ({ page }) => {
  await page.goto("/catalogs/saas/databases");
  await test.expect(page.getByRole("heading", { name: /Databases\./ })).toBeVisible();
  await test.expect(page.locator('a[href="/catalogs/saas/databases/neon"]').first()).toBeVisible();
  await test.expect(page.locator('a[href="/catalogs/saas/databases/turso"]').first()).toBeVisible();
});

test("saas entry page shows limits field", async ({ page }) => {
  await page.goto("/catalogs/saas/databases/neon");
  await test.expect(page.getByRole("heading", { name: /Neon\./ })).toBeVisible();
  await test.expect(page.locator("th", { hasText: "Limits" })).toBeVisible();
  await test.expect(page.getByText(/5 GB|read/i).first()).toBeVisible();
});
