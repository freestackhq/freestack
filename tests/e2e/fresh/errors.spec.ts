import { expect, test } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

test.describe("not found (NotFound.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("an unknown route returns 404 with the page", async ({ page }) => {
    const res = await page.goto("/no-such-page-here");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Error 404")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Not on the shelf");
    await expect(page.locator("main")).toContainText("may have a typo");
  });

  test("search is the one main action and opens search", async ({ page }) => {
    await page.goto("/no-such-page-here");
    const search = page.locator("main").getByRole("button", { name: /Search \d+ tools/ });
    await expect(search).toHaveClass(/btn-promo/);
    await expect(page.locator("main .btn-promo")).toHaveCount(1);
    await search.click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("home link and aisles with counts from the catalog", async ({ page }) => {
    await page.goto("/no-such-page-here");
    await expect(page.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
    const aisles = page.locator("[data-aisle-links] a");
    expect(await aisles.count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator('[data-aisle-links] a[href="/databases"]')).toContainText(/Databases\s*\d+ labels?/);
    await expect(page.locator('[data-aisle-links] a[href="/student-programs"]')).toContainText(/\d+ programs?/);
  });

  test("report the broken link on GitHub", async ({ page }) => {
    await page.goto("/no-such-page-here");
    const report = page.getByRole("link", { name: /Report the broken link/ });
    await expect(report).toHaveAttribute("href", "https://github.com/freestackhq/freestack/issues/new");
    await expect(report).toHaveAttribute("target", "_blank");
    await expect(report).toContainText("opens in a new tab");
  });
});

test.describe("not found on a phone", () => {
  test.use({ viewport: PHONE });

  test("reflows without side scroll", async ({ page }) => {
    await page.goto("/no-such-page-here");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoSideScroll(page);
  });
});

/*
 * /dev/throw is an on-demand route that always throws, so the real 500 path
 * (Worker error -> src/pages/500.astro) runs in the built preview.
 */
test.describe("site error (Edges.dc.html, Site error)", () => {
  test.use({ viewport: DESKTOP });

  test("a thrown error renders the 500 page with status 500", async ({ page }) => {
    const res = await page.goto("/dev/throw");
    expect(res?.status()).toBe(500);
    const alert = page.getByRole("alert");
    await expect(alert).toContainText("Something broke on our side");
    await expect(alert).toContainText("The page did not load.");
  });

  test("Try again reloads the same address, Go home goes home", async ({ page }) => {
    await page.goto("/dev/throw?x=1");
    await expect(page.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/dev/throw?x=1");
    await expect(page.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });

  test("never leaks the error message", async ({ page }) => {
    await page.goto("/dev/throw");
    await expect(page.locator("body")).not.toContainText("test-only failure");
  });

  test("phone: reflows without side scroll", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/dev/throw");
    await expect(page.getByRole("alert")).toBeVisible();
    await expectNoSideScroll(page);
  });
});
