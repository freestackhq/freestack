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
    // Facts every part shares are said once under the total; the rest stay on the row.
    const shared = await p.locator(".shared [data-fact]").count();
    // Every row: job, tool link, its headline limit with the aisle scale, the
    // sell + card facts (no "Open to all") and its check state.
    for (let i = 0; i < (await rows.count()); i++) {
      const r = rows.nth(i);
      await expect(r.locator(".job")).not.toBeEmpty();
      await expect(r.locator("a.tool")).toHaveAttribute("href", /^\/[a-z-]+\/[a-z0-9-]+$/);
      await expect(r.locator(".headline")).not.toBeEmpty();
      await expect(r.locator(".limit [data-scale]")).toHaveCount(1);
      expect((await r.locator("[data-fact]").count()) + shared).toBe(2);
      await expect(r.locator(".state")).not.toBeEmpty();
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
  });

  test("Hand it to my coding agent opens the agent prompt for this stack", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/?as=indie");
    await panel(page).getByRole("button", { name: "Hand it to my coding agent" }).click();
    const dialog = page.getByRole("dialog", { name: "Copy your stack" });
    await expect(dialog.getByRole("tab", { name: "For your coding agent" })).toHaveAttribute("aria-selected", "true");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      "Set up this project on these free tiers:",
    );
  });

  test("a stack with unchecked parts says so, once for the panel and inline per row", async ({ page }) => {
    await page.goto("/?as=school");
    const p = panel(page);
    const states = await p
      .locator(".row .state")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.state));
    const checked = states.filter((s) => s === "checked").length;
    const head = p.locator(".stack-head");
    if (checked === states.length) {
      await expect(head).toContainText("Ready-made stack");
    } else {
      await expect(head).toContainText("Starter stack");
      await expect(head).toContainText(`${checked} of ${states.length} parts checked`);
    }
    // Unchecked rows link to their check page; checked rows say who and when.
    const unchecked = p.locator('.row .state:not([data-state="checked"])').first();
    await expect(unchecked).toContainText(
      /Not checked yet|Due for a recheck|waiting for review|changed its pricing page/,
    );
    await expect(unchecked.getByRole("link")).toHaveAttribute("href", /\/check$/);
    await expect(p.locator('.row .state[data-state="checked"]').first()).toContainText(/^Checked /);
    // No gray strip per row any more.
    await expect(p.locator(".row-unchecked, .row-overdue")).toHaveCount(0);
    await expect(p.locator(".sit-note")).toHaveText("Unlocks the GitHub Student Pack and other edu perks.");
  });

  test("copied text marks the parts nobody has checked", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/?as=school");
    const unchecked = await panel(page)
      .locator(".row")
      .evaluateAll((els) =>
        els
          .filter((e) => e.querySelector(".state")?.getAttribute("data-state") !== "checked")
          .map((e) => e.querySelector("a.tool")!.textContent!.trim()),
      );
    await panel(page).getByRole("button", { name: "Copy this stack" }).click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    for (const name of unchecked) expect(text).toContain(`${name} (not checked yet)`);
  });

  test("the situation is chosen on the server, so ?as= works without JavaScript", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/?as=startup");
    await expect(page.locator("[data-panel]:visible")).toHaveAttribute("data-panel", "startup");
    await expect(page.getByRole("button", { name: "Startup" })).toHaveAttribute("aria-pressed", "true");
    await ctx.close();
  });

  test("a fact every part shares is said once, under the total", async ({ page }) => {
    for (const as of ["student", "school", "indie"]) {
      await page.goto(`/?as=${as}`);
      const p = panel(page);
      const rows = p.locator(".row");
      if ((await rows.count()) < 2) continue;
      for (const key of ["sell", "card"] as const) {
        const values = await rows.evaluateAll((els, k) => els.map((e) => e.getAttribute(`data-${k}`)), key);
        const sameEverywhere = new Set(values).size === 1;
        const rowFacts = p.locator(`.row [data-fact-key="${key}"]`);
        const sharedFact = p.locator(`.shared [data-fact-key="${key}"]`);
        await expect(rowFacts).toHaveCount(sameEverywhere ? 0 : values.length);
        await expect(sharedFact).toHaveCount(sameEverywhere ? 1 : 0);
        // A card value every part shares appears once, with no extra note repeating it.
        if (key === "card" && sameEverywhere) {
          expect((await p.innerText()).match(/card unknown/gi)?.length ?? 0).toBeLessThanOrEqual(1);
          await expect(p.locator(".total-note")).toHaveCount(0);
        }
      }
    }
  });

  test("the checked-labels count is not dressed as good news", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".trust")).toContainText(/\d+ of \d+ labels checked/);
    await expect(page.locator(".trust svg")).toHaveCount(0);
  });

  test("reading a label comes before the aisle list", async ({ page }) => {
    await page.goto("/");
    const reading = await page.locator(".reading").boundingBox();
    const aisles = await page.locator(".aisles").boundingBox();
    expect(reading!.y).toBeLessThan(aisles!.y);
  });

  test("switching situation is announced", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Indie builder" }).click();
    await expect(page.locator("[data-announce]")).toContainText(/^Indie builder: /);
  });

  test("no stack: Claim Once aisles for this situation, then each core part", async ({ page }) => {
    await page.goto("/?as=startup");
    const p = panel(page);
    await expect(p.locator(".row")).toHaveCount(0);
    await expect(p.locator("[data-empty]")).toContainText("No ready-made stack here yet.");
    await expect(p.locator(".sit-note")).toHaveText("Free now. Claim cloud credits once you have users.");
    await expect(p.getByRole("heading", { name: "Claim these first" })).toBeVisible();
    await expect(p.getByRole("link", { name: /Student programs/ })).toHaveAttribute("href", "/student-programs");
    await expect(p.getByRole("heading", { name: "Then pick each part" })).toBeVisible();
    await expect(p.getByRole("link", { name: /^Database in Databases/ })).toHaveAttribute("href", "/databases");
    const start = p.getByRole("link", { name: "Start one in Build a stack" });
    await expect(start).toHaveAttribute("href", "/build?as=startup");
    // The only action here, so it is the main one.
    await expect(start).toHaveClass(/\bbtn-promo\b/);
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
    // The phone dock never shows on a wide screen.
    await expect(page.locator("[data-dock]")).toBeHidden();
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
    const openerBtn = panel(page).locator(".copy-btn");
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

  test("chips pick the situation, rows keep their number, nothing scrolls sideways", async ({ page }) => {
    await page.goto("/");
    await expectNoSideScroll(page);
    const group = page.getByRole("group", { name: "I'm building as" });
    await expect(group).toBeVisible();
    await group.getByRole("button", { name: "Indie builder" }).click();
    await expect(page).toHaveURL(/\?as=indie$/);
    await expect(panel(page)).toHaveAttribute("data-panel", "indie");
    await expectNoSideScroll(page);
    // "Limits up front" holds on a phone: each row shows its headline limit.
    for (const h of await panel(page).locator(".headline").all()) await expect(h).toBeVisible();

    // Targets are at least 44px.
    for (const name of ["Copy this stack", "Hand it to my coding agent"]) {
      const box = await panel(page).getByRole("button", { name }).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    for (const chip of await group.getByRole("button").all()) {
      expect((await chip.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("Copy this stack is in reach on the first screen", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    const dock = page.locator("[data-dock]");
    const copy = dock.locator(".dock-copy");
    await expect(copy).toHaveText("Copy this stack");
    await expect(copy).toBeInViewport();
    // A touch shortcut: screen readers and Tab keep the one button in the panel.
    await expect(page.getByRole("button", { name: "Copy this stack" })).toHaveCount(1);
    await expect(copy).toHaveAttribute("tabindex", "-1");
    expect((await copy.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    // Only one yellow action on screen at a time.
    await expect(panel(page).locator(".copy-btn")).not.toBeInViewport();

    await copy.click();
    await expect(page.getByRole("dialog", { name: "Copy your stack" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("For: Student");
    await page.keyboard.press("Escape");

    // Once the panel's own actions are on screen, the dock steps aside.
    await panel(page).locator(".actions").scrollIntoViewIfNeeded();
    await expect(dock).toBeHidden();
  });

  test("no dock when the situation has no stack", async ({ page }) => {
    await page.goto("/?as=startup");
    await expect(page.locator("[data-dock]")).toBeHidden();
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
