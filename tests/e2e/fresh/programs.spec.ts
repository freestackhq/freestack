import { expect, test } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

const URL = "/student-programs";
const visible = (page: import("@playwright/test").Page) => page.locator("[data-program]:visible");

test.describe("Claim Once aisle (Programs.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("title, crumbs and intro", async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Student programs");
    await expect(page.locator(".crumbs")).toContainText("Claim Once");
    await expect(page.locator(".crumbs").getByRole("link", { name: "All aisles" })).toHaveAttribute("href", "/");
  });

  test("programs are numbered in claim order and #1 says Claim first", async ({ page }) => {
    await page.goto(URL);
    const cards = visible(page);
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
    const orders = await cards.evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-order"))));
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    const first = page.locator('[data-program][data-order="1"]');
    await expect(first.locator(".tag")).toHaveText("Claim first");
    await expect(page.locator(".tag")).toHaveCount(1);
  });

  test("program label: lasts, perks, needs, catch, how to claim", async ({ page }) => {
    await page.goto(URL);
    const gh = page.locator('[data-program="github-student-pack"]');
    await expect(gh.getByRole("heading", { name: "GitHub Student Developer Pack" })).toBeVisible();
    await expect(gh.locator(".big")).toHaveText("2 yrs");
    await expect(gh).toContainText("then verify again");
    await expect(gh.getByRole("listitem")).toHaveCount(2);
    await expect(gh).toContainText("Needs: School email or proof of enrollment");
    await expect(gh).toContainText("Lasts: About 2 years, then re-verify");
    await expect(gh.locator(".catch")).toContainText("Partner offers rotate");
    const claim = gh.getByRole("link", { name: /How to claim it/ });
    await expect(claim).toHaveAttribute("href", "https://education.github.com/pack");
    const box = await claim.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("I have defaults to a school email", async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole("button", { name: "A school email" })).toHaveAttribute("aria-pressed", "true");
    // No program here is open to everyone, so "Neither" is not offered.
    await expect(page.getByRole("button", { name: "Neither" })).toHaveCount(0);
  });

  test("A student ID only hides school-email programs and goes in the URL", async ({ page }) => {
    await page.goto(URL);
    const all = await visible(page).count();
    await page.getByRole("button", { name: "A student ID only" }).click();
    await expect(page).toHaveURL(/\?have=id$/);
    await expect(page.getByRole("button", { name: "A student ID only" })).toHaveAttribute("aria-pressed", "true");
    const whos = await visible(page).evaluateAll((els) => els.map((e) => e.getAttribute("data-who") ?? ""));
    expect(whos.length).toBeGreaterThan(0);
    expect(whos.length).toBeLessThan(all);
    for (const w of whos) expect(w.split(" ").some((x) => x === "student_any_id" || x === "anyone")).toBe(true);
    await expect(page.locator('[data-program="jetbrains-edu"]')).toBeHidden();
  });

  test("the filter is read from the URL on load", async ({ page }) => {
    await page.goto(`${URL}?have=id`);
    await expect(page.getByRole("button", { name: "A student ID only" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-program="jetbrains-edu"]')).toBeHidden();
    await expect(page.locator('[data-program="github-student-pack"]')).toBeVisible();
  });

  test("every choice offered has programs under it", async ({ page }) => {
    await page.goto(URL);
    const chips = page.locator("[data-have]");
    const n = await chips.count();
    if (n === 0) return; // no real choice: no filter, every program shows
    expect(n).toBeGreaterThan(1);
    for (let i = 0; i < n; i++) {
      await chips.nth(i).click();
      expect(await visible(page).count(), await chips.nth(i).innerText()).toBeGreaterThan(0);
      await expect(page.locator("[data-empty]")).toBeHidden();
    }
  });

  test("a link to a choice this aisle doesn't offer falls back to the default", async ({ page }) => {
    await page.goto(URL);
    const offered = await page
      .locator("[data-have]")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.have));
    const missing = ["school", "id", "none"].find((h) => !offered.includes(h));
    test.skip(!missing, "this aisle offers every choice");
    await page.goto(`${URL}?have=${missing}`);
    await expect(page.getByRole("button", { name: "A school email" })).toHaveAttribute("aria-pressed", "true");
    expect(await visible(page).count()).toBeGreaterThan(0);
  });

  test("an unknown filter value falls back to the default", async ({ page }) => {
    await page.goto(`${URL}?have=banana`);
    await expect(page.getByRole("button", { name: "A school email" })).toHaveAttribute("aria-pressed", "true");
  });

  test("count is announced", async ({ page }) => {
    await page.goto(URL);
    const status = page.locator('[role="status"][data-count]');
    await expect(status).toHaveText(/\d+ programs? you can claim/);
  });

  test("footer note says whether anyone checked", async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator("[data-note]")).toContainText("Order and terms from the claim-order guide.");
    await expect(page.locator("[data-note]")).not.toContainText(/verified/i);
  });

  test("filter buttons are 44px targets", async ({ page }) => {
    await page.goto(URL);
    const chips = page.locator("[data-have]");
    expect(await chips.count()).toBeGreaterThan(1);
    for (const box of await chips.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) {
      expect(box).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("Claim Once aisle on a phone", () => {
  test.use({ viewport: PHONE });

  test("reflows without side scroll", async ({ page }) => {
    await page.goto(URL);
    await expect(visible(page).first()).toBeVisible();
    await expectNoSideScroll(page);
  });
});
