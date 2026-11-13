import { expect, test } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

test.describe("label states (States.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("renders all six strips", async ({ page }) => {
    await page.goto("/dev/states/");
    const cell = (id: string) => page.locator(`[data-state-cell="${id}"]`);
    await expect(cell("neon").locator('[data-state="checked"]')).toContainText(/Checked (today|\d+ days ago) by Karlo/);
    await expect(cell("neon")).toContainText("Suggested");
    await expect(cell("convex").locator('[data-state="unchecked"]')).toContainText("Not checked yet");
    await expect(cell("convex").getByRole("link", { name: /Check it/ })).toHaveAttribute("href", "/databases/convex/check");
    await expect(cell("supabase").locator('[data-state="overdue"]')).toContainText("Due for a recheck");
    await expect(cell("supabase")).not.toContainText("Suggested");
    await expect(cell("d1").locator('[data-state="review"]')).toContainText("A change is waiting for review");
    await expect(cell("turso").locator('[data-state="vendor-changed"]')).toContainText("Turso changed its pricing page on");
    await expect(cell("turso").getByRole("link", { name: "Recheck this label" })).toBeVisible();
    await expect(cell("xata-lite").locator('[data-state="imported"]')).toContainText("From free-for-dev. No numbers yet");
    await expect(cell("xata-lite").getByRole("link", { name: /Write its label/ })).toHaveAttribute("href", /^\/add\?/);
  });

  test("every strip is at least 44px tall", async ({ page }) => {
    await page.goto("/dev/states/");
    const strips = page.locator("[data-state-cell] .strip");
    const n = await strips.count();
    expect(n).toBe(6);
    for (let i = 0; i < n; i++) {
      const box = await strips.nth(i).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("scale, unknown and no limit", async ({ page }) => {
    await page.goto("/dev/states/");
    const full = page.locator(".grid");
    await expect(full.locator('[data-tool="neon"] [role="img"]')).toHaveAttribute("aria-label", "Small: 1 of 5 on this aisle's scale.");
    await expect(full.locator('[data-tool="appwrite"]')).toContainText("?");
    await expect(full.locator('[data-tool="appwrite"]')).toContainText("Not listed");
    await expect(full.locator('[data-tool="pocketbase"]')).toContainText("No limit");
    await expect(full.locator('[data-tool="pocketbase"]')).toContainText("Your own disk");
  });

  test("facts carry one sentence each for screen readers", async ({ page }) => {
    await page.goto("/dev/states/");
    const neon = page.locator('.grid [data-tool="neon"]');
    await expect(neon).toContainText("Anyone can claim it.");
    await expect(neon).toContainText("You can sell with it.");
    await expect(neon).toContainText("Not known if it needs a credit card.");
  });
});

test.describe("header and Aisles menu (AislesMenu.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("header has wordmark, search, Aisles and Add a tool", async ({ page }) => {
    await page.goto("/dev/states/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "freestack" })).toHaveAttribute("href", "/");
    await expect(nav.getByRole("button", { name: /Search \d+ tools/ })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Add a tool" })).toHaveAttribute("href", "/add");
  });

  test("opens on click, closes on Esc and outside click", async ({ page }) => {
    await page.goto("/dev/states/");
    const btn = page.getByRole("button", { name: "Aisles" });
    const menu = page.locator("#aisles-menu");
    await btn.click();
    await expect(menu).toBeVisible();
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("link", { name: /Databases/ })).toHaveAttribute("href", "/databases");
    for (const l of ["Build a stack", "Check my stack", "For coding agents"]) {
      await expect(menu.getByRole("link", { name: l })).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(btn).toBeFocused();

    await btn.click();
    await expect(menu).toBeVisible();
    await page.mouse.click(700, 850);
    await expect(menu).toBeHidden();
  });

  test("opens with Enter", async ({ page }) => {
    await page.goto("/dev/states/");
    await page.getByRole("button", { name: "Aisles" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#aisles-menu")).toBeVisible();
  });

  test("footer links", async ({ page }) => {
    await page.goto("/dev/states/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Check my stack" })).toHaveAttribute("href", "/check");
    await expect(footer.getByRole("link", { name: "For coding agents" })).toHaveAttribute("href", "/agents");
    await expect(footer.getByRole("link", { name: "Source on GitHub" })).toBeVisible();
  });
});

test.describe("phone menu (PhoneMenu.dc.html)", () => {
  test.use({ viewport: PHONE });

  test("full screen, traps focus, closes", async ({ page }) => {
    await page.goto("/dev/states/");
    await expectNoSideScroll(page);
    await page.getByRole("button", { name: "Menu" }).click();
    const menu = page.locator("#aisles-menu");
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box!.width).toBe(390);

    // Groups collapse; Build starts open.
    await expect(menu.getByRole("link", { name: /Databases/ })).toBeVisible();
    await menu.getByRole("button", { name: "Claim Once" }).click();
    await expect(menu.getByRole("link", { name: /Student programs/ })).toBeVisible();

    // Focus stays inside.
    for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
    expect(await menu.evaluate((m) => m.contains(document.activeElement))).toBe(true);

    await menu.getByRole("button", { name: "Close menu" }).click();
    await expect(menu).toBeHidden();
  });
});
