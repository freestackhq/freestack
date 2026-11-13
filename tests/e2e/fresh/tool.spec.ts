import { expect, test, type Page } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

/*
 * Tool page (Tool.dc.html, PhoneTool.dc.html). Sample data lives in
 * src/data/sample.ts; each state below maps to one sample tool:
 *   neon: checked, Suggested    convex: not checked    supabase: overdue
 *   d1: change waiting for review    turso: vendor changed
 *   xata-lite: imported from an awesome list    fauna: removed
 */

const checkRow = (page: Page) => page.locator("[data-check-row]");

test.describe("tool page, desktop", () => {
  test.use({ viewport: DESKTOP });

  test("crumbs, label, actions and title", async ({ page }) => {
    await page.goto("/databases/neon/");
    await expect(page).toHaveTitle(/Neon/);
    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumbs.getByRole("link", { name: "All aisles" })).toHaveAttribute("href", "/");
    await expect(crumbs.getByRole("link", { name: "Databases" })).toHaveAttribute("href", "/databases");
    await expect(crumbs).toContainText("Neon");

    await expect(page.getByRole("heading", { level: 1, name: "Neon" })).toBeVisible();
    await expect(page.getByText("Postgres that sleeps when nobody is using it.")).toBeVisible();

    const label = page.locator('.side article[data-tool="neon"]');
    await expect(label).toBeVisible();
    await expect(label).toContainText("0.5 GB");
    await expect(label).toContainText("Suggested");

    const add = page.locator(".side").getByRole("link", { name: "Add to compare" });
    await expect(add).toHaveAttribute("href", "/compare?ids=neon");

    const go = page.locator(".side").getByRole("link", { name: /Go to neon\.tech/ });
    await expect(go).toHaveAttribute("href", "https://neon.tech");
    await expect(go).toHaveAttribute("target", "_blank");
    await expect(go).toHaveAttribute("rel", /noopener/);
    await expect(go).toContainText("(opens in a new tab)");
  });

  test("should-you-use panel", async ({ page }) => {
    await page.goto("/databases/neon/");
    const panel = page.locator("[data-decide]");
    await expect(page.getByRole("heading", { name: "Should you use Neon?" })).toBeAttached();
    await expect(panel.locator("[data-use-if] li")).toHaveCount(4);
    await expect(panel.locator("[data-use-if]")).toContainText("You want a normal SQL database.");

    const skip = panel.locator("[data-skip-if]");
    await expect(skip.locator("li")).toHaveCount(4);
    await expect(skip.getByRole("link", { name: "Use Supabase" })).toHaveAttribute("href", "/databases/supabase");
    await expect(skip.getByRole("link", { name: "Use Cloudflare D1" })).toHaveAttribute("href", "/databases/d1");
    await expect(skip.getByRole("link", { name: "Use Turso" }).first()).toHaveAttribute("href", "/databases/turso");

    const catches = page.locator("[data-catch]");
    await expect(catches.getByRole("heading", { name: "The catch" })).toBeVisible();
    await expect(catches.locator("li")).toHaveCount(3);
    await expect(catches).toContainText("Sleeps after 5 minutes of no traffic. The next visit is slow.");

    const fits = page.locator("[data-fits]");
    await expect(fits).toContainText("Fits");
    for (const s of ["Student with school email", "Student", "Indie builder", "Startup"]) {
      await expect(fits.getByText(s, { exact: true })).toBeVisible();
    }
    await expect(fits.getByRole("link", { name: "Compare with Supabase and Turso" })).toHaveAttribute(
      "href",
      "/compare?ids=neon,supabase,turso",
    );
  });

  test("catch falls back to catches when there is no catch_detail", async ({ page }) => {
    await page.goto("/databases/supabase/");
    await expect(page.locator("[data-catch] li")).toHaveCount(1);
    await expect(page.locator("[data-catch]")).toContainText("Pauses after 1 week idle");
  });

  test("empty sections admit it instead of guessing", async ({ page }) => {
    await page.goto("/databases/convex/");
    // Convex has no tagline: the kind stands in.
    await expect(page.locator(".tagline")).toContainText("Reactive backend.");
    await expect(page.locator("[data-use-if]")).toContainText("Not written yet");
    await expect(page.locator("[data-skip-if]")).toContainText("Not written yet");
    await expect(page.locator("[data-catch]")).toContainText("None listed");
    await expect(page.locator("[data-fits]")).toContainText("Unknown");
  });

  test("check row: checked", async ({ page }) => {
    await page.goto("/databases/neon/");
    const row = checkRow(page);
    await expect(row).toHaveAttribute("data-state", "checked");
    await expect(row.getByRole("heading")).toHaveText(/Checked (today|yesterday|\d+ days ago) by Karlo/);
    await expect(row.getByRole("link", { name: "Something changed" })).toHaveAttribute("href", "/databases/neon/check");
  });

  test("check row: not checked", async ({ page }) => {
    await page.goto("/databases/convex/");
    const row = checkRow(page);
    await expect(row).toHaveAttribute("data-state", "unchecked");
    await expect(row.getByRole("heading")).toHaveText("Not checked with Convex yet");
    await expect(row).toContainText("Open their pricing page and check the numbers. Takes two minutes.");
    await expect(row.getByRole("link", { name: "The numbers hold" })).toHaveAttribute("href", "/databases/convex/check");
    await expect(row.getByRole("link", { name: "Something changed" })).toHaveAttribute("href", "/databases/convex/check");
    await expect(row.getByRole("link", { name: "their pricing page" })).toHaveAttribute("href", "https://convex.dev/pricing");
  });

  test("check row: overdue", async ({ page }) => {
    await page.goto("/databases/supabase/");
    const row = checkRow(page);
    await expect(row).toHaveAttribute("data-state", "overdue");
    await expect(row.getByRole("heading")).toHaveText(/^Checked \d+ \w{3}\. Due for a recheck$/);
    await expect(row.getByRole("link", { name: "The numbers hold" })).toHaveAttribute("href", "/databases/supabase/check");
    await expect(row.getByRole("link", { name: "Something changed" })).toBeVisible();
    await expect(page.locator(".side")).not.toContainText("Suggested");
  });

  test("check row: vendor changed", async ({ page }) => {
    await page.goto("/databases/turso/");
    const row = checkRow(page);
    await expect(row).toHaveAttribute("data-state", "vendor-changed");
    await expect(row.getByRole("heading")).toHaveText(/^Turso changed its pricing page on \d+ \w{3}$/);
    await expect(row.getByRole("link", { name: "Recheck this label" })).toHaveAttribute("href", "/databases/turso/check");
  });

  test("check row: change waiting for review", async ({ page }) => {
    await page.goto("/databases/d1/");
    const row = checkRow(page);
    await expect(row).toHaveAttribute("data-state", "review");
    await expect(row.getByRole("heading")).toHaveText("A change is waiting for review");
    await expect(row).toContainText("until a maintainer applies or rejects it");
    // No "check" buttons while a change is pending.
    await expect(row.getByRole("link", { name: "The numbers hold" })).toHaveCount(0);
  });

  test("ask your coding agent", async ({ page }) => {
    await page.goto("/databases/neon/");
    const agent = page.locator("[data-agent]");
    await expect(agent.getByRole("heading", { name: "Ask your coding agent" })).toBeVisible();
    await expect(agent).toContainText("With the freestack skill, it answers from this label.");
    await expect(agent).toContainText("Is Neon's free tier enough for my app?");
  });

  test("imported tool with no label", async ({ page }) => {
    await page.goto("/databases/xata-lite/");
    await expect(page.getByRole("heading", { level: 1, name: "Xata Lite" })).toBeVisible();
    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumbs.getByRole("link", { name: "Databases" })).toHaveAttribute("href", "/databases");
    await expect(crumbs).toContainText("From an awesome list");
    await expect(page.locator("[data-imported]")).toContainText("No numbers yet. From free-for-dev.");
    await expect(page.locator("[data-imported]")).toContainText("Nobody has written its label.");
    await expect(page.getByRole("link", { name: "Write its label" })).toHaveAttribute("href", /^\/add\?name=Xata%20Lite/);
    await expect(page.getByRole("link", { name: /Go to xata\.io/ })).toHaveAttribute("target", "_blank");
    // No made-up decision panel, check row or compare.
    await expect(page.locator("[data-decide]")).toHaveCount(0);
    await expect(page.locator("[data-check-row]")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /compare/i })).toHaveCount(0);
  });

  test("removed tool redirects to its aisle with a 301", async ({ request }) => {
    const res = await request.get("/databases/fauna", { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers()["location"]).toMatch(/\/databases\/?$/);
  });

  test("unknown tool is a 404, not a redirect", async ({ request }) => {
    const res = await request.get("/databases/not-a-tool", { maxRedirects: 0 });
    expect(res.status()).toBe(404);
  });

  test("keyboard focus is visible on actions", async ({ page }) => {
    await page.goto("/databases/convex/");
    const link = checkRow(page).getByRole("link", { name: "The numbers hold" });
    await link.focus();
    const outline = await link.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
  });
});

test.describe("tool page, phone", () => {
  test.use({ viewport: PHONE });

  for (const id of ["neon", "convex", "supabase", "d1", "turso", "xata-lite"]) {
    test(`${id} never scrolls sideways`, async ({ page }) => {
      await page.goto(`/databases/${id}/`);
      await expectNoSideScroll(page);
    });
  }

  test("back link, title with scale, summary, sticky actions", async ({ page }) => {
    await page.goto("/databases/neon/");
    await expect(page.locator(".phone-back")).toHaveAttribute("href", "/databases");
    await expect(page.locator(".phone-back")).toBeVisible();
    await expect(page.locator(".phone-head [role=img]")).toHaveAttribute("aria-label", /of 5 on this aisle's scale/);
    await expect(page.locator(".phone-summary")).toContainText("0.5 GB free storage.");
    const bar = page.locator(".phone-bar");
    await expect(bar).toBeVisible();
    await expect(bar.getByRole("link", { name: "+ Compare" })).toHaveAttribute("href", "/compare?ids=neon");
    await expect(bar.getByRole("link", { name: /Go to neon\.tech/ })).toBeVisible();
    // Desktop actions are hidden, so links are not doubled.
    await expect(page.locator(".side").getByRole("link", { name: /Go to/ })).toBeHidden();
  });

  test("touch targets are at least 44px", async ({ page }) => {
    await page.goto("/databases/convex/");
    const targets = page.locator(".phone-bar a, [data-check-row] a.btn, .phone-back");
    const n = await targets.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const box = await targets.nth(i).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
