import { expect, test, type Page } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

/*
 * Compare (Compare.dc.html, PhoneCompare.dc.html, cross-aisle message in
 * States.dc.html). Server-rendered: every choice is in ?ids=.
 */

const table = (page: Page) => page.locator("[data-compare-table]");
const row = (page: Page, label: string) => table(page).locator(`tr[data-row="${label}"]`);
const ids = (page: Page) => new URL(page.url()).searchParams.get("ids");

test.describe("compare, desktop", () => {
  test.use({ viewport: DESKTOP });

  test("two tools side by side", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso");
    await expect(page).toHaveTitle(/Neon or Turso/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Neon or Turso?");
    await expect(page.getByRole("link", { name: "Databases aisle" })).toHaveAttribute("href", "/databases");
    const cols = table(page).locator("thead th[data-col]");
    await expect(cols).toHaveCount(2);
    await expect(cols.nth(0)).toContainText("0.5 GB");
    await expect(cols.nth(1)).toContainText("5 GB");
    await expect(table(page)).toContainText("Big number: free storage. All cost $0 a month. Shaded rows differ.");
    // The dashed add column is there with room for more.
    await expect(table(page).locator("thead th[data-add]")).toContainText("Up to 4 side by side");
  });

  test("three tools headline", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso,supabase");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Neon, Turso or Supabase?");
    await expect(table(page).locator("thead th[data-col]")).toHaveCount(3);
  });

  test("rows that differ are shaded and say so in text", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso");
    const sell = row(page, "Can sell");
    await expect(sell).not.toHaveClass(/differs/);
    await expect(sell.locator("th")).not.toContainText("Differs");

    const card = row(page, "Credit card");
    await expect(card).toHaveClass(/differs/);
    await expect(card.locator("th")).toContainText("Differs");
    const bg = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");

    // "Pick it if" is never marked: it always differs.
    await expect(row(page, "Pick it if").locator("th")).not.toContainText("Differs");
  });

  test("unknown cells say Unknown", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso");
    // Neon's card requirement is unknown in the data.
    await expect(row(page, "Credit card").locator("td").nth(0)).toHaveText("Unknown");
    await expect(row(page, "Credit card").locator("td").nth(1)).toHaveText("Not needed");
    await expect(page.locator("[data-unknown-note]")).toContainText("Check one");
  });

  test("unknown headline shows ? and Not listed", async ({ page }) => {
    await page.goto("/compare?ids=neon,appwrite");
    const col = table(page).locator('thead th[data-col="appwrite"]');
    await expect(col).toContainText("?");
    await expect(col).toContainText("Not listed");
  });

  test("✕ removes a column and updates the URL", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso,supabase");
    await table(page).getByRole("link", { name: "Remove Turso from comparison" }).click();
    await expect(page).toHaveURL(/ids=neon(%2C|,)supabase/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Neon or Supabase?");
  });

  test("add picker lists the same aisle and adds a column", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso");
    const pick = table(page).getByLabel("Add a tool to compare");
    const options = await pick.locator("option").allTextContents();
    expect(options).toContain("Supabase");
    expect(options).not.toContain("Neon");
    expect(options).not.toContain("Upstash Redis");
    expect(options).not.toContain("Xata Lite");
    await pick.selectOption("supabase");
    await expect(page).toHaveURL(/ids=neon(%2C|,)turso(%2C|,)supabase/);
    await expect(table(page).locator("thead th[data-col]")).toHaveCount(3);
  });

  test("menu per column swaps the tool", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso");
    await table(page).getByLabel("Tool 1").selectOption("convex");
    await expect(page).toHaveURL(/ids=convex(%2C|,)turso/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Convex or Turso?");
  });

  test("swapping to a tool already in another column trades places", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso");
    await table(page).getByLabel("Tool 1").selectOption("turso");
    await expect(page).toHaveURL(/ids=turso(%2C|,)neon/);
  });

  test("four is the cap: no add column", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso,supabase,d1");
    await expect(table(page).locator("thead th[data-col]")).toHaveCount(4);
    await expect(table(page).locator("thead th[data-add]")).toHaveCount(0);
  });

  test("more than four keeps the first four and says so", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso,supabase,d1,convex");
    await expect(table(page).locator("thead th[data-col]")).toHaveCount(4);
    await expect(page.locator("[data-notice]")).toContainText("Up to 4 side by side. We kept the first 4.");
  });

  test("only one tool: pick one more", async ({ page }) => {
    await page.goto("/compare?ids=neon");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pick one more to compare");
    await expect(table(page).locator("thead th[data-col]")).toHaveCount(1);
    await expect(table(page).getByLabel("Add a tool to compare")).toBeVisible();
  });

  test("a tool that no longer exists is dropped, with a note", async ({ page }) => {
    await page.goto("/compare?ids=neon,fauna,turso");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Neon or Turso?");
    await expect(page.locator("[data-notice]")).toContainText('"fauna" is no longer in the catalog, so we dropped it.');
    // Links built from here no longer carry it.
    await expect(page.locator("[data-copy-link]").first()).toHaveAttribute("href", "/compare?ids=neon,turso");
  });

  test("tools from two aisles: the cross-aisle message", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso,vercel-hobby");
    const msg = page.locator("[data-cross-aisle]");
    await expect(msg).toContainText("Compare works inside one aisle.");
    await expect(msg).toContainText("You picked Vercel Hobby from Hosting, but the rest are from Databases.");
    await expect(msg.getByRole("link", { name: "Start a Hosting compare" })).toHaveAttribute(
      "href",
      "/compare?ids=vercel-hobby",
    );
    await expect(msg.getByRole("link", { name: "Keep databases" })).toHaveAttribute("href", "/compare?ids=neon,turso");
    await expect(table(page)).toHaveCount(0);
  });

  test("none: offer the aisles", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Compare free tools");
    await expect(page.getByRole("link", { name: "Databases" }).last()).toHaveAttribute("href", "/databases");
    await expect(table(page)).toHaveCount(0);
  });

  test("only rows that differ", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso");
    await expect(row(page, "Can sell")).toHaveCount(1);
    await page.locator("main").getByLabel("Only rows that differ").first().check();
    await expect(page).toHaveURL(/only=differs/);
    await expect(row(page, "Can sell")).toHaveCount(0);
    await expect(row(page, "Credit card")).toHaveCount(1);
  });

  test("copy link to this comparison", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/compare?ids=neon,turso");
    await page.getByRole("link", { name: "Copy link to this comparison" }).first().click();
    await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toMatch(/\/compare\?ids=neon,turso$/);
    expect(ids(page)).toBe("neon,turso");
  });
});

test.describe("compare without JavaScript", () => {
  test.use({ viewport: DESKTOP, javaScriptEnabled: false });

  test("add and swap work through plain forms", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso");
    await table(page).getByLabel("Add a tool to compare").selectOption("supabase");
    await table(page).getByRole("button", { name: "Add" }).click();
    await expect(page).toHaveURL(/\/compare\?ids=neon(%2C|,)turso(%2C|,)supabase$/);

    await table(page).getByLabel("Tool 2").selectOption("convex");
    await table(page).getByRole("button", { name: "Swap tool 2" }).click();
    await expect(page).toHaveURL(/\/compare\?ids=neon(%2C|,)convex(%2C|,)supabase$/);
  });
});

test.describe("compare, phone", () => {
  test.use({ viewport: PHONE });

  for (const q of ["ids=neon,turso", "ids=neon,turso,supabase,d1", "ids=neon", "ids=neon,vercel-hobby", ""]) {
    test(`never scrolls sideways (${q || "none"})`, async ({ page }) => {
      await page.goto(`/compare?${q}`);
      await expectNoSideScroll(page);
    });
  }

  test("chips, stacked rows with Differs, copy link", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso,supabase");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Neon, Turso or Supabase?");
    const chips = page.getByRole("list", { name: "Tools in this comparison" });
    await expect(chips.getByRole("listitem")).toHaveCount(3);
    await expect(chips.getByRole("link", { name: "Remove Neon from comparison" })).toBeVisible();

    const storage = page.locator('[data-phone-row="Free storage"]');
    await expect(storage).toBeVisible();
    await expect(storage).toContainText("Differs");
    await expect(storage).toHaveClass(/differs/);
    await expect(page.locator('[data-phone-row="Can sell"]')).not.toContainText("Differs");
    await expect(page.getByRole("link", { name: "Copy link to this comparison" }).last()).toBeVisible();
    await expect(table(page)).toBeHidden();
  });

  test("touch targets are at least 44px", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso");
    const targets = page.locator(".phone-only a:visible, .phone-only select:visible, .phone-only label:visible");
    const n = await targets.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const box = await targets.nth(i).boundingBox();
      expect(box!.height, await targets.nth(i).evaluate((e) => e.outerHTML.slice(0, 80))).toBeGreaterThanOrEqual(44);
    }
  });
});
