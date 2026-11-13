import { expect, test, type Page } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

const panel = (page: Page) => page.locator("[data-panel]:visible");

test.describe("Home (Home.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("hero, default situation and the stack panel", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pick a stack and start building.");
    await expect(page.locator(".lede")).toHaveText(
      /^\d+ free tools, student perks and APIs\. Limits and catches up front\.$/,
    );

    const group = page.getByRole("group", { name: "I'm building as" });
    for (const l of ["Student with school email", "Student", "Indie builder", "Startup"]) {
      await expect(group.getByRole("button", { name: l, exact: true })).toBeVisible();
    }
    await expect(group.getByRole("button", { name: "Student", exact: true })).toHaveAttribute("aria-pressed", "true");

    const p = panel(page);
    await expect(p).toHaveCount(1);
    const rows = p.locator(".row");
    expect(await rows.count()).toBeGreaterThan(0);
    // Every row: job, tool link, limits and the sell + card facts (no "Open to all").
    for (let i = 0; i < (await rows.count()); i++) {
      const r = rows.nth(i);
      await expect(r.locator(".job")).not.toBeEmpty();
      await expect(r.locator("a.tool")).toHaveAttribute("href", /^\/[a-z-]+\/[a-z0-9-]+$/);
      await expect(r.locator(".limits")).not.toBeEmpty();
      await expect(r.locator("[data-fact]")).toHaveCount(2);
      await expect(r).not.toContainText("Open to all");
    }
    // A catch shows with its wrench and a text label for screen readers.
    await expect(p.locator(".catch").first()).toContainText("Catch:");
    await expect(p.locator(".price")).toHaveText("$0.00");
    await expect(p.getByText("Total per month")).toBeVisible();
  });

  test("situation goes in the URL and is read on load", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Indie builder" }).click();
    await expect(page).toHaveURL(/\?as=indie$/);
    await expect(panel(page)).toHaveAttribute("data-panel", "indie");

    await page.goto("/?as=school");
    await expect(page.getByRole("button", { name: "Student with school email" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(panel(page)).toHaveAttribute("data-panel", "school");

    // Unknown value keeps the default.
    await page.goto("/?as=wizard");
    await expect(panel(page)).toHaveAttribute("data-panel", "student");
  });

  test("swap parts opens Build a stack with the same picks", async ({ page }) => {
    await page.goto("/?as=indie");
    const ids = await panel(page)
      .locator(".row")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.tool));
    const href = await panel(page).getByRole("link", { name: "Swap parts in Build a stack" }).getAttribute("href");
    expect(href).toMatch(/^\/build\?as=indie&/);
    for (const id of ids) expect(href).toContain(`=${id}`);
    await expect(panel(page).getByRole("link", { name: "Hand it to my coding agent" })).toHaveAttribute(
      "href",
      "/agents",
    );
  });

  test("a preset tool that is not freshly checked shows its state", async ({ page }) => {
    await page.goto("/?as=school");
    const state = panel(page).locator(".state");
    await expect(state.first()).toBeVisible();
    await expect(state.first()).toContainText(
      /Not checked yet|Due for a recheck|waiting for review|changed its pricing page/,
    );
    await expect(state.first().getByRole("link")).toHaveAttribute("href", /\/check$/);
    // Checked rows stay quiet.
    await expect(panel(page).locator('.row:not([class*="row-"]) .state')).toHaveCount(0);
  });

  test("no valid preset shows the aisle list instead of an empty panel", async ({ page }) => {
    await page.goto("/?as=startup");
    const p = panel(page);
    await expect(p.locator(".row")).toHaveCount(0);
    await expect(p.locator("[data-empty]")).toContainText("No ready-made stack here yet.");
    await expect(p.getByRole("link", { name: /Databases/ })).toHaveAttribute("href", "/databases");
    const start = p.getByRole("link", { name: "Start one in Build a stack" });
    await expect(start).toHaveAttribute("href", "/build?as=startup");
    // The only action here, so it looks like one.
    await expect(start).toHaveClass(/\bbtn\b/);
    expect((await start.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(p.getByRole("button", { name: "Copy this stack" })).toHaveCount(0);
  });

  test("rest of the page: aisles, reading a label, agents", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Or walk the aisles" })).toBeVisible();
    await expect(page.locator(".aisles .group").first()).toHaveText("Build");
    await expect(page.locator(".aisles").getByRole("link", { name: /Databases/ })).toHaveAttribute(
      "href",
      "/databases",
    );
    await expect(page.getByRole("heading", { name: "Reading a label" })).toBeVisible();
    await expect(page.locator(".reading .strip")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Let your coding agent shop for you" })).toBeVisible();
    await expect(page.locator("#agents code")).toHaveText("npx skills add https://github.com/freestackhq/freestack");
    // Copy rules.
    await expect(page.locator("body")).not.toContainText(/generous free tier|verified/i);
  });

  test("at most one yellow action", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator(".btn-promo:visible").count()).toBeLessThanOrEqual(1);
  });
});

test.describe("Copy this stack (CopyStack.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("opens with three formats and copies", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/?as=indie");
    const opener = panel(page).getByRole("button", { name: "Copy this stack" });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "Copy your stack" });
    await expect(dialog).toBeVisible();

    const tabs = dialog.getByRole("tab");
    await expect(tabs).toHaveText(["For your notes", "Link", "For your coding agent"]);
    await expect(dialog.getByRole("tab", { name: "For your notes" })).toHaveAttribute("aria-selected", "true");
    const text = dialog.locator("pre");
    await expect(text).toContainText("## My free stack (from freestack)");
    await expect(text).toContainText("For: Indie builder");

    // The button does what it says: the stack is already copied, and both
    // copy buttons say so on their own label for a moment.
    await expect(dialog.getByRole("status")).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("For: Indie builder");
    const copyText = dialog.locator("[data-copy]");
    await expect(copyText).toHaveText("Copied");
    // Found by attribute: while it says "Copied" its accessible name changes.
    const openerBtn = panel(page).locator("[data-copy-stack]");
    await expect(openerBtn).toHaveText("Copied");
    await expect(dialog.locator("[data-status]")).toHaveClass(/sr-only/);
    await expect(copyText).toHaveText("Copy text", { timeout: 4000 });
    await expect(opener).toHaveText("Copy this stack");

    // Copying again from the dialog flashes that button.
    await page.evaluate(() => navigator.clipboard.writeText(""));
    await dialog.getByRole("button", { name: "Copy text" }).click();
    await expect(copyText).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("For: Indie builder");

    // Arrow keys move between tabs.
    await dialog.getByRole("tab", { name: "For your notes" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByRole("tab", { name: "Link" })).toHaveAttribute("aria-selected", "true");
    await expect(text).toHaveText(/^http:\/\/localhost:\d+\/build\?as=indie&/);

    await dialog.getByRole("button", { name: "Copy link" }).click();
    const toast = page.locator("[data-toast]");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Link copied");
    await expect(toast).toContainText("Anyone with it sees this stack.");
    await toast.getByRole("button", { name: "Dismiss" }).click();
    await expect(toast).toBeHidden();

    await dialog.getByRole("tab", { name: "For your coding agent" }).click();
    await expect(text).toContainText("Set up this project on these free tiers:");
    await expect(dialog.getByRole("button", { name: "Copy prompt" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("clipboard blocked: says so and selects the text", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("blocked")) },
      });
    });
    await page.goto("/");
    await panel(page).getByRole("button", { name: "Copy this stack" }).click();
    const dialog = page.getByRole("dialog", { name: "Copy your stack" });
    // The copy on open fails the same way as the button, and says so visibly.
    await expect(dialog.getByRole("status")).toContainText("Could not copy");
    await expect(dialog.getByRole("status")).toBeVisible();
    await expect(dialog.locator("[data-copy]")).toHaveText("Copy text");
    expect(await page.evaluate(() => window.getSelection()?.toString() ?? "")).toContain("My free stack");
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe("Home on a phone (PhoneHome.dc.html)", () => {
  test.use({ viewport: PHONE });

  test("select picks the situation, nothing scrolls sideways", async ({ page }) => {
    await page.goto("/");
    await expectNoSideScroll(page);
    await expect(page.getByRole("group", { name: "I'm building as" })).toBeHidden();
    const select = page.getByRole("combobox", { name: "I'm building as" });
    await expect(select).toHaveValue("student");
    await select.selectOption("indie");
    await expect(page).toHaveURL(/\?as=indie$/);
    await expect(panel(page)).toHaveAttribute("data-panel", "indie");
    await expectNoSideScroll(page);

    // Targets are at least 44px.
    for (const name of ["Copy this stack", "Hand it to my coding agent"]) {
      const box = await panel(page)
        .getByRole(name.startsWith("Copy") ? "button" : "link", { name })
        .boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    const sbox = await select.boundingBox();
    expect(sbox!.height).toBeGreaterThanOrEqual(44);
  });

  test("copy dialog fits the phone", async ({ page }) => {
    await page.goto("/");
    await panel(page).getByRole("button", { name: "Copy this stack" }).click();
    const box = await page.getByRole("dialog").boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    await expectNoSideScroll(page);
  });
});
