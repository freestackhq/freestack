import { test } from "@playwright/test";

test("catalogs index lists both catalogs with entry counts", async ({ page }) => {
  await page.goto("/catalogs");
  await test.expect(page.getByRole("heading", { name: "catalogs." })).toBeVisible();
  await test.expect(page.getByRole("heading", { name: "Self-hosted" })).toBeVisible();
  await test.expect(page.getByRole("heading", { name: "Free tools" })).toBeVisible();
  await test.expect(page.locator("text=/entries/").first()).toBeVisible();
});

test("catalog index shows categories", async ({ page }) => {
  await page.goto("/catalogs/selfhosted");
  await test.expect(page.getByRole("heading", { name: /Self-hosted\./ })).toBeVisible();
  await test.expect(page.getByRole("heading", { name: "Databases & Management" })).toBeVisible();
  await test.expect(page.getByRole("heading", { name: "Security & Identity" })).toBeVisible();
});

test("category page renders comparison matrix and entry rows", async ({ page }) => {
  await page.goto("/catalogs/selfhosted/databases");
  await test.expect(page.getByRole("heading", { name: /Databases & Management\./ })).toBeVisible();
  // matrix table
  await test.expect(page.locator("table")).toBeVisible();
  await test.expect(page.locator("table").getByText("PostgreSQL").first()).toBeVisible();
  // entry list links to detail
  const link = page.locator('a[href="/catalogs/selfhosted/databases/postgresql"]').first();
  await test.expect(link).toBeVisible();
});

test("entry page renders fields, pick, and alternatives", async ({ page }) => {
  await page.goto("/catalogs/selfhosted/databases/postgresql");
  await test.expect(page.getByRole("heading", { name: /PostgreSQL\./ })).toBeVisible();
  await test.expect(page.getByText("Pick this if")).toBeVisible();
  await test.expect(page.getByText("https://www.postgresql.org").first()).toBeVisible();
  // alternatives block
  await test.expect(page.getByText("How it compares")).toBeVisible();
  await test.expect(page.getByText("MariaDB", { exact: false }).first()).toBeVisible();
});

test("free-tools category renders from converted markdown", async ({ page }) => {
  await page.goto("/catalogs/free-tools/databases");
  await test.expect(page.getByRole("heading", { name: /Databases\./ })).toBeVisible();
  await test.expect(page.locator('a[href="/catalogs/free-tools/databases/neon"]').first()).toBeVisible();
  await test.expect(page.locator('a[href="/catalogs/free-tools/databases/turso"]').first()).toBeVisible();
});

test("free-tools entry page shows limits field", async ({ page }) => {
  await page.goto("/catalogs/free-tools/databases/neon");
  await test.expect(page.getByRole("heading", { name: /Neon\./ })).toBeVisible();
  await test.expect(page.locator("th", { hasText: "Limits" })).toBeVisible();
  await test.expect(page.getByText(/5 GB|read/i).first()).toBeVisible();
});