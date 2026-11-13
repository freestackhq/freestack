import { expect, test, type Page } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

const banner = (page: Page) => page.locator("[data-banner]");
const row = (page: Page, part: string) => page.locator(`tbody[data-part="${part}"] tr:visible`);

test.describe("Build a stack (Builder.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("no parts yet", async ({ page }) => {
    await page.goto("/build");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Build a stack");
    await expect(banner(page)).toHaveAttribute("data-kind", "empty");
    await expect(banner(page)).toContainText("No parts yet");
    for (const p of ["hosting", "database", "sign-in", "secrets"]) {
      await expect(page.getByRole("button", { name: `+ Choose ${p}` })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Copy this stack" }).first()).toBeDisabled();
    await expect(page.getByRole("button", { name: "Share link" })).toBeDisabled();
    await expect(page).toHaveURL(/\/build\/?\?as=student$/);
  });

  test("reads picks from the URL; all fine", async ({ page }) => {
    await page.goto("/build?as=indie&hosting=cf-workers&auth=clerk");
    await expect(page.getByRole("button", { name: "Indie builder" })).toHaveAttribute("aria-pressed", "true");
    await expect(row(page, "hosting")).toContainText("Cloudflare Workers & Pages");
    await expect(row(page, "hosting").getByRole("link", { name: "Cloudflare Workers & Pages" })).toHaveAttribute(
      "href",
      "/hosting/cf-workers",
    );
    await expect(row(page, "hosting")).toContainText("$0");
    await expect(row(page, "auth")).toContainText("Clerk");
    await expect(banner(page)).toHaveAttribute("data-kind", "ok");
    await expect(banner(page)).toContainText("Works. No problems found");
    await expect(page.locator("tfoot")).toContainText("$0.00");
    await expect(page).toHaveURL(/\?as=indie&hosting=cf-workers&auth=clerk$/);
  });

  test("problems first, then to watch", async ({ page }) => {
    await page.goto("/build?as=indie&hosting=vercel-hobby&database=supabase&auth=clerk");
    await expect(banner(page)).toHaveAttribute("data-kind", "problem");
    await expect(page.locator("[data-banner-title]")).toHaveText("1 problem, 1 to watch");
    const items = banner(page).locator("li");
    await expect(items.nth(0)).toHaveText("Problem: Vercel Hobby does not allow selling, and you are building to sell. Swap hosting.");
    await expect(items.nth(1)).toHaveText("To watch: Supabase already has sign-in built in. You may not need Clerk.");
    await expect(row(page, "hosting")).toHaveClass(/has-problem/);
    await expect(row(page, "hosting")).toContainText("Has a problem.");
    await expect(row(page, "database")).not.toHaveClass(/has-problem/);

    // Situation changes the checks and the URL.
    await page.getByRole("button", { name: "Student", exact: true }).click();
    await expect(page).toHaveURL(/\?as=student&/);
    await expect(page.locator("[data-banner-title]")).toHaveText("Works. 1 to watch");
  });

  test("a rule that needs a missing part: D1 without Workers", async ({ page }) => {
    await page.goto("/build?as=student&database=d1");
    await expect(banner(page)).toContainText(
      "Cloudflare D1 only runs inside Cloudflare Workers. Pair it with Cloudflare hosting.",
    );
    await expect(row(page, "database")).toHaveClass(/has-problem/);

    await page.getByRole("button", { name: "+ Choose hosting" }).click();
    const picker = page.getByRole("dialog", { name: "Choose hosting" });
    await expect(picker).toBeVisible();
    await picker.locator('[data-option="cf-workers"]').getByRole("button", { name: /Add/ }).click();
    await expect(picker).toBeHidden();
    await expect(banner(page)).toHaveAttribute("data-kind", "ok");
    await expect(page).toHaveURL(/hosting=cf-workers&database=d1/);
    await expect(row(page, "hosting").getByRole("button", { name: "Swap hosting" })).toBeFocused();
  });

  test("swap with the picker shows how each option fits", async ({ page }) => {
    await page.goto("/build?as=indie&hosting=cf-workers&database=d1");
    await row(page, "hosting").getByRole("button", { name: "Swap hosting" }).click();
    const picker = page.getByRole("dialog", { name: "Choose hosting" });
    await expect(picker.locator(".pick-count")).toHaveText(/^\d+ free options?$/);
    const opt = (id: string) => picker.locator(`[data-option="${id}"]`);
    await expect(opt("cf-workers").getByRole("button")).toHaveText(/^Selected/);
    await expect(opt("vercel-hobby").locator("[data-fit]")).toHaveText("Clashes: no selling");
    // Swapping Workers away would break D1.
    await expect(opt("koyeb").locator("[data-fit]")).toHaveText("Breaks Cloudflare D1: needs Cloudflare hosting");
    await expect(opt("koyeb")).toHaveClass(/clash/);
    await page.keyboard.press("Escape");
    await expect(picker).toBeHidden();

    await row(page, "database").getByRole("button", { name: "Swap database" }).click();
    const db = page.getByRole("dialog", { name: "Choose database" });
    await db.locator('[data-option="neon"]').getByRole("button", { name: /Add/ }).click();
    await expect(page).toHaveURL(/database=neon/);
    await expect(page.locator("[data-banner-title]")).toHaveText("Works. 1 to watch");
  });

  test("a part removed, with undo", async ({ page }) => {
    await page.goto("/build?as=indie&hosting=cf-workers&database=neon");
    await row(page, "database").getByRole("button", { name: "Remove database" }).click();
    await expect(page.getByRole("button", { name: "+ Choose database" })).toBeVisible();
    await expect(page.getByRole("button", { name: "+ Choose database" })).toBeFocused();
    await expect(page).toHaveURL(/\?as=indie&hosting=cf-workers$/);
    await expect(page.locator("[data-note]")).toContainText("Removed Neon from database.");
    await expect(page.locator("[data-banner-title]")).toHaveText("Works. No problems found");

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page).toHaveURL(/database=neon/);
    await expect(row(page, "database")).toContainText("Neon");

    // Removing every part goes back to "No parts yet".
    await row(page, "database").getByRole("button", { name: "Remove database" }).click();
    await row(page, "hosting").getByRole("button", { name: "Remove hosting" }).click();
    await expect(banner(page)).toHaveAttribute("data-kind", "empty");
  });

  test("a tool the link no longer lists is dropped and named", async ({ page }) => {
    await page.goto("/build?as=indie&hosting=fauna&database=neon");
    await expect(page.locator("[data-note]")).toHaveText("This link had a tool we no longer list (fauna). We left it out.");
    await expect(page.getByRole("button", { name: "+ Choose hosting" })).toBeVisible();
    await expect(page).toHaveURL(/\?as=indie&database=neon$/);
  });

  test("extra parts can be added", async ({ page }) => {
    await page.goto("/build?as=student&cache=upstash-redis");
    await expect(row(page, "cache")).toContainText("Upstash Redis");
    await expect(page.getByRole("button", { name: "+ Cache" })).toBeHidden();
    await page.getByRole("button", { name: "+ Email" }).click();
    const picker = page.getByRole("dialog", { name: "Choose email" });
    await picker.locator("[data-option] button").first().click();
    await expect(page).toHaveURL(/&email=/);
  });

  test("copy, share and check links", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/build?as=indie&hosting=cf-workers&database=neon");
    await expect(page.getByRole("link", { name: "Already have a stack? Check it" })).toHaveAttribute("href", "/check?as=indie");

    await page.getByRole("button", { name: "Share link" }).click();
    await expect(page.locator("[data-toast]")).toContainText("Link copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
      /\/build\?as=indie&hosting=cf-workers&database=neon$/,
    );

    await page.locator(".actions").getByRole("button", { name: "Copy this stack" }).click();
    const dialog = page.getByRole("dialog", { name: "Copy your stack" });
    await expect(dialog.locator("pre")).toContainText("- Database: Neon");
    await expect(dialog.locator("pre")).toContainText("For: Indie builder");
    expect(await page.locator(".btn-promo:visible").count()).toBeLessThanOrEqual(1);
  });
});

test.describe("Build a stack on a phone (PhoneBuilder.dc.html)", () => {
  test.use({ viewport: PHONE });

  test("cards, select and the bottom bar", async ({ page }) => {
    await page.goto("/build?as=indie&hosting=vercel-hobby&database=supabase&auth=clerk");
    await expectNoSideScroll(page);
    const select = page.getByRole("combobox", { name: "I'm building as" });
    await expect(select).toHaveValue("indie");
    await expect(page.locator("[data-banner-title]")).toHaveText("1 problem, 1 to watch");
    await expect(page.getByRole("button", { name: "+ Choose secrets" })).toBeVisible();
    // Catches stay visible on the phone card; "no catch" rows hide the dash.
    await expect(row(page, "hosting").locator(".catch")).toBeVisible();
    await expect(row(page, "auth").locator(".catch")).toBeHidden();

    const bar = page.locator(".phone-bar");
    await expect(bar).toContainText("$0.00");
    await expect(bar.getByRole("button", { name: "Copy this stack" })).toBeVisible();
    expect(await page.locator(".btn-promo:visible").count()).toBe(1);

    for (const name of ["Swap hosting", "Remove hosting"]) {
      const box = await page.getByRole("button", { name }).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }

    await select.selectOption("student");
    await expect(page).toHaveURL(/\?as=student&/);
    await page.getByRole("button", { name: "Swap hosting" }).click();
    await expectNoSideScroll(page);
    const box = await page.getByRole("dialog", { name: "Choose hosting" }).boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });
});
