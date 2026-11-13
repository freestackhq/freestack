import { expect, test } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

const URL = "/catches/can-i-sell-on-vercel-hobby/";

test.describe("catch page (Trap.dc.html)", () => {
  test.use({ viewport: DESKTOP });

  test("answer comes first, then the detail", async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Can I sell things on Vercel Hobby?");
    const answer = page.locator("[data-answer]");
    await expect(answer.locator(".answer")).toHaveText("No.");
    await expect(answer).toContainText("Hobby is for personal projects only.");
  });

  test("crumbs link back to the aisle", async ({ page }) => {
    await page.goto(URL);
    const crumbs = page.locator(".crumbs");
    await expect(crumbs.getByRole("link", { name: "All aisles" })).toHaveAttribute("href", "/");
    await expect(crumbs.getByRole("link", { name: "Hosting" })).toHaveAttribute("href", "/hosting");
    await expect(crumbs).toContainText("Catches");
  });

  test("lists what it includes and what is still fine", async ({ page }) => {
    await page.goto(URL);
    const includes = page.getByRole("list", { name: "That includes" });
    await expect(includes.getByRole("listitem")).toHaveCount(3);
    await expect(includes).toContainText("Taking payments, even a tip button");
    await expect(page.getByRole("list", { name: "Still fine" })).toContainText("Portfolios");
  });

  test("source, link to it, and the check date", async ({ page }) => {
    await page.goto(URL);
    const src = page.locator("[data-source]");
    await expect(src).toContainText("From Vercel's Fair Use Guidelines");
    await expect(src.getByRole("link", { name: /Read the source/ })).toHaveAttribute(
      "href",
      "https://vercel.com/docs/limits/fair-use-guidelines",
    );
    await expect(src).toContainText(/Checked \d{1,2} [A-Z][a-z]{2} \d{4}/);
  });

  test("Already on the plan: one yellow action to Check my stack", async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole("heading", { name: "Already on Hobby?" })).toBeVisible();
    const cta = page.getByRole("link", { name: "Check my stack" }).first();
    await expect(cta).toHaveAttribute("href", "/check");
    await expect(page.locator("main .btn-promo")).toHaveCount(1);
    await expect(page.getByText("Not legal advice. When in doubt, ask Vercel.")).toBeVisible();
  });

  test("free tools that avoid the catch, as small labels", async ({ page }) => {
    await page.goto(URL);
    const alt = page.getByRole("region", { name: "Free hosts that let you sell" });
    const cards = alt.locator("article");
    await expect(cards).toHaveCount(2);
    const cf = alt.locator('[data-tool="cf-workers"]');
    await expect(cf.getByRole("link", { name: "Cloudflare Workers & Pages" })).toHaveAttribute("href", "/hosting/cf-workers");
    await expect(cf).toContainText("100k");
    await expect(cf).toContainText("requests a day");
    await expect(cf).toContainText("You can sell with it.");
    // A tool with no headline number shows "?" and "Not listed", never a guess.
    const koyeb = alt.locator('[data-tool="koyeb"]');
    await expect(koyeb.locator(".big")).toHaveText("?");
    await expect(koyeb).toContainText("Not listed");
  });

  test("unknown catch is a 404", async ({ page }) => {
    const res = await page.goto("/catches/no-such-catch/");
    expect(res?.status()).toBe(404);
  });
});

test.describe("catch page on a phone", () => {
  test.use({ viewport: PHONE });

  test("reflows without side scroll", async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator("[data-answer] .answer")).toBeVisible();
    await expectNoSideScroll(page);
  });

  test("the main action is a 44px target", async ({ page }) => {
    await page.goto(URL);
    const box = await page.locator("main .btn-promo").boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
