import { expect, test } from "@playwright/test";
import {
  DESKTOP,
  PHONE,
  audit,
  expectSkipLink,
  missingFocusRings,
  movingElements,
  smallTargets,
  structureProblems,
} from "../a11y";

/*
 * Accessibility pass (issue 7.1) on the fixture build: the on-demand pages
 * (home, compare, add, 404, 500), every label state, and the open dialogs
 * and menus. Real-catalog pages are in real-data-a11y.spec.ts.
 */
const PAGES = [
  "/",
  "/?as=startup",
  "/compare?ids=neon,turso",
  "/compare?ids=neon,turso,supabase,d1",
  "/compare?ids=neon",
  "/databases",
  "/databases/xata-lite",
  "/add",
  "/no-such-page",
  "/dev/throw",
  "/dev/states/",
];

for (const [name, viewport] of [
  ["desktop", DESKTOP],
  ["phone", PHONE],
] as const) {
  test.describe(`a11y ${name}`, () => {
    test.use({ viewport });

    for (const path of PAGES) {
      test(path, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator("h1").first()).toBeVisible();
        await audit(page, `${name} ${path}`);
        expect(await structureProblems(page), `${name} ${path} structure`).toEqual([]);
        if (name === "phone") expect(await smallTargets(page), `${path} targets`).toEqual([]);
      });
    }

    test("Aisles menu open", async ({ page }) => {
      await page.goto("/databases");
      await page.getByRole("button", { name: name === "phone" ? "Menu" : "Aisles" }).click();
      const menu = page.getByRole("dialog", { name: "Aisles menu" });
      await expect(menu).toBeVisible();
      await audit(page, `${name} aisles menu`);
      if (name === "phone") expect(await smallTargets(page, "#aisles-menu")).toEqual([]);
    });

    test("Copy this stack dialog", async ({ page }) => {
      await page.goto("/?as=indie");
      await page.getByRole("button", { name: "Copy this stack" }).click();
      const dialog = page.getByRole("dialog", { name: "Copy your stack" });
      await expect(dialog).toBeVisible();
      await audit(page, `${name} copy dialog`);
      if (name === "phone") expect(await smallTargets(page, "#copy-stack")).toEqual([]);
      expect(await missingFocusRings(page, 12)).toEqual([]);
    });

    test("search with no results", async ({ page }) => {
      await page.goto("/");
      await page.keyboard.press("Control+k");
      await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
      await page.keyboard.type("zzqqxx");
      await expect(page.locator("[data-search-empty]")).not.toBeEmpty();
      await audit(page, `${name} search empty`);
    });
  });
}

test.describe("phone", () => {
  test.use({ viewport: PHONE });

  test("phone menu traps focus and Esc returns it to the button", async ({ page }) => {
    await page.goto("/databases");
    const btn = page.getByRole("button", { name: "Menu" });
    await btn.click();
    const menu = page.locator("#aisles-menu");
    await expect(menu).toBeVisible();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("#aisles-menu"))).toBe(true);
    }
    await page.keyboard.press("Shift+Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("#aisles-menu"))).toBe(true);
    expect(await missingFocusRings(page, 30)).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(btn).toBeFocused();
  });

  test("filter sheet", async ({ page }) => {
    await page.goto("/databases");
    await page.getByRole("button", { name: /^Must allow/ }).click();
    const sheet = page.getByRole("dialog", { name: "Must allow" });
    await expect(sheet).toBeVisible();
    await audit(page, "phone filter sheet");
    expect(await smallTargets(page, "dialog[open]")).toEqual([]);
    expect(await missingFocusRings(page, 15)).toEqual([]);
  });

  test("compare marks differing rows in text", async ({ page }) => {
    await page.goto("/compare?ids=neon,turso,supabase,d1");
    const rows = page.locator("tr.differs");
    expect(await rows.count()).toBeGreaterThan(0);
    for (const row of await rows.all()) await expect(row.locator("th")).toContainText("Differs");
  });
});

test.describe("keyboard", () => {
  test.use({ viewport: DESKTOP });

  for (const path of [
    "/",
    "/databases",
    "/compare?ids=neon,turso,supabase,d1",
    "/add",
    "/no-such-page",
    "/dev/throw",
  ]) {
    test(`skip link and focus rings on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expectSkipLink(page);
      await page.keyboard.press("Enter");
      expect(await page.evaluate(() => location.hash)).toBe("#main");
      await page.goto(path);
      expect(await missingFocusRings(page, 80)).toEqual([]);
    });
  }

  test("Aisles menu: focus rings inside the open menu", async ({ page }) => {
    await page.goto("/databases");
    await page.getByRole("button", { name: "Aisles" }).click();
    await expect(page.locator("#aisles-menu")).toBeVisible();
    expect(await missingFocusRings(page, 30)).toEqual([]);
  });

  test("search results keep a visible focus", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    await page.keyboard.type("neon");
    expect(await missingFocusRings(page, 6)).toEqual([]);
  });
});

test.describe("reduced motion", () => {
  test.use({ viewport: DESKTOP, contextOptions: { reducedMotion: "reduce" } });

  test("nothing animates", async ({ page }) => {
    for (const path of ["/", "/databases", "/compare?ids=neon,turso"]) {
      await page.goto(path);
      expect(await movingElements(page), path).toEqual([]);
    }
  });
});
