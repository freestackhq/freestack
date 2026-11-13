import { expect, test, type Page } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

const PAGE = "/dev/states/";

function dialog(page: Page) {
  return page.getByRole("dialog", { name: "Search" });
}
function input(page: Page) {
  return dialog(page).getByRole("combobox", { name: "Search tools, catches and aisles" });
}

test.describe("search overlay (Search.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("header button opens it; Esc closes and returns focus", async ({ page }) => {
    await page.goto(PAGE);
    const trigger = page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: /Search \d+ tools/ });
    await trigger.click();
    await expect(dialog(page)).toBeVisible();
    await expect(input(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("opens with Ctrl K, ⌘K and /", async ({ page }) => {
    await page.goto(PAGE);
    for (const key of ["Control+k", "Meta+k", "/"]) {
      await page.locator("body").press(key);
      await expect(dialog(page), key).toBeVisible();
      await expect(input(page)).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog(page)).toBeHidden();
    }
  });

  test("/ does not open it while typing in a field", async ({ page }) => {
    await page.goto("/add");
    const name = page.getByLabel("Tool name");
    await name.fill("");
    await name.press("/");
    await expect(dialog(page)).toBeHidden();
    await expect(name).toHaveValue("/");
  });

  test("clicking outside closes it", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator("body").press("Control+k");
    await expect(dialog(page)).toBeVisible();
    await page.mouse.click(20, 880);
    await expect(dialog(page)).toBeHidden();
  });

  test("groups results as catches, tools, aisles and hides empty groups", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator("body").press("Control+k");
    await input(page).fill("vercel");
    const list = dialog(page).getByRole("listbox");
    await expect(list.getByRole("group", { name: "Catches" })).toBeVisible();
    await expect(list.getByRole("group", { name: "Tools" })).toBeVisible();
    await expect(list.getByRole("group", { name: "Tools" }).getByRole("option").first()).toContainText("Vercel Hobby");
    // No aisle matches "vercel": no Aisles header at all.
    await expect(list.getByRole("group", { name: "Aisles" })).toHaveCount(0);
    await expect(list).not.toContainText("Aisles");

    await input(page).fill("databases");
    await expect(list.getByRole("group", { name: "Aisles" })).toContainText("Databases");
    await expect(list.getByRole("group", { name: "Aisles" })).toContainText(/\d+ labels?/);
  });

  test("tool rows say whether you can sell, in words", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator("body").press("Control+k");
    await input(page).fill("vercel hobby");
    const row = dialog(page).getByRole("group", { name: "Tools" }).getByRole("option").first();
    await expect(row).toContainText("Selling with it is not allowed.");
  });

  test("arrow keys move, Enter opens", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator("body").press("Control+k");
    await input(page).fill("neon");
    const options = dialog(page).getByRole("option");
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    const firstId = await options.first().getAttribute("id");
    await expect(input(page)).toHaveAttribute("aria-activedescendant", firstId!);

    await input(page).press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(options.first()).toHaveAttribute("aria-selected", "false");
    await input(page).press("ArrowUp");
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    // Wraps from the top to the last option.
    await input(page).press("ArrowUp");
    await expect(options.last()).toHaveAttribute("aria-selected", "true");

    await input(page).press("ArrowDown");
    const href = await options.first().getAttribute("href");
    await input(page).press("Enter");
    await expect(page).toHaveURL(new RegExp(`${href!.replace(/\//g, "\\/")}/?$`));
  });

  test("no results: did you mean, and add it", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator("body").press("Control+k");
    await input(page).fill("pocketbse");
    const status = dialog(page).getByRole("status");
    await expect(status).toContainText('Nothing matches "pocketbse"');
    await expect(status.getByRole("link", { name: "PocketBase" })).toHaveAttribute("href", "/databases/pocketbase");
    await expect(status.getByRole("link", { name: "Add it" })).toHaveAttribute("href", "/add?name=pocketbse");
    await expect(dialog(page).getByRole("option")).toHaveCount(0);
    await expect(input(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("no results with nothing close: no did you mean", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator("body").press("Control+k");
    await input(page).fill("zzqqxx");
    const status = dialog(page).getByRole("status");
    await expect(status).toContainText('Nothing matches "zzqqxx"');
    await expect(status).not.toContainText("Did you mean");
    await expect(status.getByRole("link", { name: "Add it" })).toHaveAttribute("href", "/add?name=zzqqxx");
  });
});

test.describe("search on a phone (PhoneSearch.dc.html)", () => {
  test.use({ viewport: PHONE });

  test("full screen, clear and close", async ({ page }) => {
    await page.goto(PAGE);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    const d = dialog(page);
    await expect(d).toBeVisible();
    const box = await d.boundingBox();
    expect(box!.width).toBe(390);
    expect(box!.height).toBeGreaterThanOrEqual(844);

    await input(page).fill("sleeps");
    await expect(d.getByRole("group", { name: "Catches" })).toBeVisible();
    await expectNoSideScroll(page);

    await d.getByRole("button", { name: "Clear search" }).click();
    await expect(input(page)).toHaveValue("");
    await expect(input(page)).toBeFocused();
    await expect(d.getByRole("option")).toHaveCount(0);

    await d.getByRole("button", { name: "Close search" }).click();
    await expect(d).toBeHidden();
  });

  test("touch targets are at least 44px", async ({ page }) => {
    await page.goto(PAGE);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await input(page).fill("neon");
    const d = dialog(page);
    for (const el of [d.getByRole("button", { name: "Close search" }), d.getByRole("option").first()]) {
      const b = await el.boundingBox();
      expect(b!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
