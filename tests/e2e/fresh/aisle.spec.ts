import { expect, test, type Page } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";
import { aisle, checkHref, toolsInAisle, unlabeledInAisle } from "../../../src/lib/fresh/catalog";
import { labelState } from "../../../src/lib/fresh/label";

// Expected values come from the catalog, never from the boards.
const db = aisle("databases")!;
const dbTools = toolsInAisle("databases");
const grid = (page: Page) => page.locator("[data-grid]");
const visibleIds = (page: Page) =>
  grid(page)
    .locator("article.label:visible")
    .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.tool));
const tray = (page: Page) => page.getByRole("region", { name: "Compare tray" });
const toggle = (page: Page, id: string) => page.locator(`[data-grid] button[data-compare-toggle="${id}"]`);

test.describe("aisle page, desktop (Aisle.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("title block: crumbs, title, count line and see-also link", async ({ page }) => {
    await page.goto("/databases");
    const crumbs = page.locator(".crumbs").first();
    await expect(crumbs.getByRole("link", { name: "All aisles" })).toHaveAttribute("href", "/");
    await expect(crumbs).toContainText("Build");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Databases");
    await expect(page.locator("[data-count-line]")).toContainText(`${dbTools.length} free databases, by free storage.`);
    await expect(page.locator("[data-count-line]").getByRole("link", { name: db.seeAlso!.name })).toHaveAttribute(
      "href",
      `/${db.seeAlso!.aisle}`,
    );
  });

  test("grid follows the catalog order, imported entries stay out", async ({ page }) => {
    await page.goto("/databases");
    expect(await visibleIds(page)).toEqual(dbTools.map((t) => t.id));
    for (const u of unlabeledInAisle("databases")) await expect(grid(page).locator(`[data-tool="${u.id}"]`)).toHaveCount(0);
  });

  test("other aisles render, Claim Once aisles are not built here", async ({ page }) => {
    await page.goto("/hosting");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hosting");
    // Hosting has no type chips.
    await expect(page.getByRole("group", { name: "Type" })).toHaveCount(0);
    await expect(page.getByRole("group", { name: "Must allow" })).toBeVisible();
  });

  test("check line counts checked labels and links to an unchecked one", async ({ page }) => {
    await page.goto("/databases");
    const checked = dbTools.filter((t) => labelState(t, new Date()) === "checked").length;
    const overdue = dbTools.filter((t) => labelState(t, new Date()) === "overdue").length;
    const note = page.getByRole("note");
    await expect(note).toContainText(`${checked} of ${dbTools.length} checked against the vendor's page.`);
    if (overdue) await expect(note).toContainText(`${overdue} ${overdue === 1 ? "is" : "are"} due for a recheck.`);
    const target = dbTools.find((t) => labelState(t, new Date()) === "unchecked")!;
    await expect(note.getByRole("link", { name: "Check one" })).toHaveAttribute("href", checkHref(target));
  });

  test("type chips filter labels and write the URL", async ({ page }) => {
    await page.goto("/databases");
    const types = page.getByRole("group", { name: "Type" });
    await expect(types.getByRole("button", { name: "Any type" })).toHaveAttribute("aria-pressed", "true");
    await types.getByRole("button", { name: "Postgres" }).click();
    await expect(types.getByRole("button", { name: "Postgres" })).toHaveAttribute("aria-pressed", "true");
    await expect(types.getByRole("button", { name: "Any type" })).toHaveAttribute("aria-pressed", "false");
    await expect(page).toHaveURL(/\?type=postgres$/);
    const pg = dbTools.filter((t) => t.type === "postgres").map((t) => t.id);
    expect(await visibleIds(page)).toEqual(pg);
    await expect(page.locator("[data-labels-count]:visible")).toHaveText(`${pg.length} labels`);
    await types.getByRole("button", { name: "Any type" }).click();
    await expect(page).toHaveURL(/\/databases\/?$/);
    expect(await visibleIds(page)).toHaveLength(dbTools.length);
  });

  test("filters in the URL are applied on load", async ({ page }) => {
    await page.goto("/databases?type=sqlite&must=sell,no-card");
    const must = page.getByRole("group", { name: "Must allow" });
    await expect(page.getByRole("group", { name: "Type" }).getByRole("button", { name: "SQLite" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(must.getByRole("button", { name: "OK to sell" })).toHaveAttribute("aria-pressed", "true");
    await expect(must.getByRole("button", { name: "No credit card" })).toHaveAttribute("aria-pressed", "true");
    const want = dbTools.filter((t) => t.type === "sqlite" && t.sell === "yes" && t.card === "no").map((t) => t.id);
    expect(await visibleIds(page)).toEqual(want);
  });

  test("must-allow chips toggle and combine", async ({ page }) => {
    await page.goto("/databases");
    const must = page.getByRole("group", { name: "Must allow" });
    await must.getByRole("button", { name: "No credit card" }).click();
    await expect(page).toHaveURL(/must=no-card/);
    expect(await visibleIds(page)).toEqual(dbTools.filter((t) => t.card === "no").map((t) => t.id));
    await must.getByRole("button", { name: "No credit card" }).click();
    await expect(page).toHaveURL(/\/databases\/?$/);
  });

  test("chips are 44px targets with visible focus", async ({ page }) => {
    await page.goto("/databases");
    const chip = page.getByRole("group", { name: "Must allow" }).getByRole("button").first();
    expect((await chip.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await chip.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const outline = await chip.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
  });

  test("no matches: offers to drop one filter with its count, and Clear filters", async ({ page }) => {
    // Storage's only tool needs a card, so "No credit card" plus "OK to sell" matches nothing.
    await page.goto("/storage?must=sell,no-card");
    const panel = page.locator("[data-nomatch]");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("No storage service fits all 2 filters");
    await expect(panel).toContainText("Can sell and no credit card.");
    const drop = panel.getByRole("button", { name: /^Drop "No card" \(\d+ match\)$/ });
    await expect(drop).toBeVisible();
    await drop.click();
    await expect(page).toHaveURL(/\?must=sell$/);
    await expect(panel).toBeHidden();
    expect((await visibleIds(page)).length).toBeGreaterThan(0);

    await page.goto("/storage?must=no-card");
    await expect(panel).toContainText("No storage service fits this filter");
    await panel.getByRole("button", { name: "Clear filters" }).click();
    await expect(page).toHaveURL(/\/storage\/?$/);
    await expect(panel).toBeHidden();
  });

  test("compare tray: starts empty, hint under 2, Compare link, URL", async ({ page }) => {
    await page.goto("/databases");
    await expect(tray(page)).toBeHidden();
    const [a, b] = dbTools;
    await toggle(page, a.id).click();
    await expect(toggle(page, a.id)).toHaveAttribute("aria-pressed", "true");
    await expect(toggle(page, a.id).locator("[data-on]")).toBeVisible();
    await expect(toggle(page, a.id).locator("[data-off]")).toBeHidden();
    await expect(tray(page)).toBeVisible();
    await expect(tray(page)).toContainText("1 to compare");
    await expect(tray(page).getByRole("status")).toHaveText("Add one more to compare");
    await expect(tray(page).getByRole("link", { name: "Compare labels" })).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`compare=${a.id}$`));

    await toggle(page, b.id).click();
    await expect(tray(page)).toContainText("2 to compare");
    await expect(tray(page).locator("[role=status]")).toHaveText("");
    await expect(tray(page).getByRole("link", { name: "Compare labels" })).toHaveAttribute(
      "href",
      `/compare?ids=${a.id},${b.id}`,
    );

    await tray(page).getByRole("button", { name: `Remove ${a.name} from compare` }).click();
    await expect(toggle(page, a.id)).toHaveAttribute("aria-pressed", "false");
    await expect(tray(page)).toContainText("1 to compare");

    await tray(page).getByRole("button", { name: "Clear" }).click();
    await expect(tray(page)).toBeHidden();
    await expect(page).toHaveURL(/\/databases\/?$/);
  });

  test("compare tray: max 4, message at the cap", async ({ page }) => {
    await page.goto("/databases");
    const ids = dbTools.slice(0, 5).map((t) => t.id);
    for (const id of ids.slice(0, 4)) await toggle(page, id).click();
    await toggle(page, ids[4]).click();
    await expect(toggle(page, ids[4])).toHaveAttribute("aria-pressed", "false");
    await expect(tray(page).getByRole("status")).toHaveText("You can compare 4 at a time. Remove one to add another.");
    await expect(tray(page)).toContainText("4 to compare");
    // Removing one clears the message.
    await toggle(page, ids[0]).click();
    await expect(tray(page).locator("[role=status]")).toHaveText("");
  });

  test("tray picks in the URL are restored", async ({ page }) => {
    const [a, b] = dbTools;
    await page.goto(`/databases?compare=${a.id},${b.id}`);
    await expect(toggle(page, a.id)).toHaveAttribute("aria-pressed", "true");
    await expect(toggle(page, b.id)).toHaveAttribute("aria-pressed", "true");
    await expect(tray(page)).toContainText("2 to compare");
  });

  test("compare across aisles: navy status, start the other compare or keep this one", async ({ page }) => {
    const a = dbTools[0];
    await page.goto(`/databases?compare=${a.id},vercel-hobby`);
    const msg = page.locator("[data-cross]");
    await expect(msg).toHaveAttribute("role", "status");
    await expect(msg).toContainText("Compare works inside one aisle.");
    await expect(msg).toContainText("You picked Vercel Hobby from Hosting, but your tray has 1 database.");
    await expect(msg).toContainText("Your database picks stay saved for when you come back.");
    await msg.getByRole("button", { name: "Keep databases" }).click();
    await expect(msg).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`compare=${a.id}$`));
    await expect(tray(page)).toContainText("1 to compare");

    await page.goto(`/databases?compare=${a.id},vercel-hobby`);
    await msg.getByRole("button", { name: "Start a Hosting compare" }).click();
    await expect(page).toHaveURL(/\/hosting\/?\?compare=vercel-hobby$/);
    await expect(page.locator('[data-grid] button[data-compare-toggle="vercel-hobby"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // Coming back restores the saved database picks.
    await page.goto("/databases");
    await expect(toggle(page, a.id)).toHaveAttribute("aria-pressed", "true");
  });

  test("unlabeled bin lists imported entries with Write its label, and ignores filters", async ({ page }) => {
    const bin = unlabeledInAisle("databases");
    await page.goto("/databases?type=documents");
    const section = page.getByRole("region", { name: "The unlabeled bin" });
    await expect(section).toBeVisible();
    for (const u of bin) {
      const row = section.locator(`[data-bin="${u.id}"]`);
      await expect(row).toContainText(u.name);
      await expect(row).toContainText(new URL(u.url).hostname);
      await expect(row.getByRole("link", { name: /Write its label/ })).toHaveAttribute("href", /^\/add\?/);
    }
  });

  test("no bin when an aisle has no imported entries", async ({ page }) => {
    await page.goto("/hosting");
    await expect(page.getByRole("region", { name: "The unlabeled bin" })).toHaveCount(0);
  });

  test("loading skeleton while URL filters apply, then could not load", async ({ page }) => {
    await page.clock.install();
    // Hold back the page scripts, as on a dropped connection.
    await page.route(/\/_astro\/.*\.js$/, (r) => r.abort());
    await page.goto("/databases?type=postgres", { waitUntil: "domcontentloaded" });
    const skeleton = page.locator('[aria-busy="true"][aria-label="Loading labels"]');
    await expect(skeleton).toBeVisible();
    await expect(grid(page)).toBeHidden();
    await page.clock.runFor(11_000);
    const alert = page.getByRole("alert");
    await expect(alert).toContainText("The labels did not load");
    await expect(alert.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(skeleton).toBeHidden();
    // The labels stay on screen.
    await expect(grid(page)).toBeVisible();
  });

  test("no skeleton or alert on a normal load", async ({ page }) => {
    await page.goto("/databases?type=postgres");
    await expect(page.locator('[aria-label="Loading labels"]')).toBeHidden();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
});

test.describe("aisle page, phone (Phone.dc.html, PhoneSheet.dc.html)", () => {
  test.use({ viewport: PHONE });

  test("never scrolls sideways, with the tray and filters set", async ({ page }) => {
    const [a, b] = dbTools;
    await page.goto(`/databases?type=postgres&compare=${a.id},${b.id}`);
    await expectNoSideScroll(page);
    await page.goto(`/databases?compare=${a.id},vercel-hobby`);
    await expectNoSideScroll(page);
    await page.goto("/storage?must=no-card");
    await expectNoSideScroll(page);
  });

  test("type select and back link replace the desktop chips and crumbs", async ({ page }) => {
    await page.goto("/databases");
    await expect(page.getByRole("group", { name: "Type" })).toBeHidden();
    await expect(page.getByRole("link", { name: "All aisles" })).toBeVisible();
    const select = page.getByRole("combobox", { name: "Type" });
    await select.selectOption("sqlite");
    await expect(page).toHaveURL(/\?type=sqlite$/);
    expect(await visibleIds(page)).toEqual(dbTools.filter((t) => t.type === "sqlite").map((t) => t.id));
    await expect(page.locator("[data-labels-count]:visible")).toHaveText(
      `${dbTools.filter((t) => t.type === "sqlite").length} labels`,
    );
  });

  test("Must allow opens the bottom sheet; switches filter live; Show closes it", async ({ page }) => {
    await page.goto("/databases");
    await page.getByRole("button", { name: /^Must allow/ }).click();
    const sheet = page.getByRole("dialog", { name: "Must allow" });
    await expect(sheet).toBeVisible();
    const box = (await sheet.boundingBox())!;
    expect(box.width).toBe(390);
    expect(box.y + box.height).toBeCloseTo(844, 0);

    await sheet.getByRole("switch", { name: "No credit card" }).check();
    await expect(page).toHaveURL(/must=no-card/);
    const n = dbTools.filter((t) => t.card === "no").length;
    const show = sheet.getByRole("button", { name: `Show ${n} databases` });
    await expect(show).toBeVisible();
    for (const row of await sheet.locator("label").all()) expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await show.click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("button", { name: /^Must allow/ })).toContainText("1");
    expect(await visibleIds(page)).toHaveLength(n);

    // Reopen: the switch reflects the URL; Clear drops must-allow filters; Esc closes.
    await page.getByRole("button", { name: /^Must allow/ }).click();
    await expect(sheet.getByRole("switch", { name: "No credit card" })).toBeChecked();
    await sheet.getByRole("button", { name: "Clear" }).click();
    await expect(page).toHaveURL(/\/databases\/?$/);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("tray adapts: count, Clear and Compare labels, no name chips", async ({ page }) => {
    const [a, b] = dbTools;
    await page.goto(`/databases?compare=${a.id},${b.id}`);
    await expect(tray(page)).toContainText("2 to compare");
    await expect(tray(page).getByRole("link", { name: "Compare labels" })).toBeVisible();
    await expect(tray(page).locator("ul")).toBeHidden();
    const box = (await tray(page).boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(844);
  });
});
