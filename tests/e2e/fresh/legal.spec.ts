import { expect, test } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

/*
 * Privacy, Terms and Contact. The test build sets no PUBLIC_CONTACT_EMAIL and
 * no PUBLIC_CF_ANALYTICS_TOKEN, so these cover the "not set" wording.
 */
const PAGES = [
  { path: "/privacy", h1: "Privacy" },
  { path: "/terms", h1: "Terms" },
  { path: "/contact", h1: "Contact" },
];

test.describe("legal and contact pages", () => {
  test.use({ viewport: DESKTOP });

  for (const { path, h1 } of PAGES) {
    test(`${path} renders with status 200 and a dated heading`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
      await expect(page).toHaveTitle(`${h1} · freestack`);
    });
  }

  test("footer links all three pages on every page", async ({ page }) => {
    for (const path of ["/", "/privacy"]) {
      await page.goto(path);
      const footer = page.locator("footer");
      await expect(footer.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
      await expect(footer.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
      await expect(footer.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
    }
  });

  test("privacy names what is collected, who processes it, how long, and who to ask", async ({ page }) => {
    await page.goto("/privacy");
    const main = page.locator("main");
    await expect(main).toContainText("No accounts and no cookies");
    // Processors, each with a link to their own policy.
    for (const name of ["Cloudflare", "GitHub"]) {
      await expect(main.getByRole("heading", { level: 3, name })).toBeVisible();
    }
    await expect(main.getByRole("link", { name: /Cloudflare's privacy policy/ })).toHaveAttribute(
      "href",
      /cloudflare\.com/,
    );
    await expect(main.getByRole("link", { name: /GitHub's privacy statement/ })).toHaveAttribute("href", /github\.com/);
    // Links that start a source line keep the space before them.
    for (const text of ["See Cloudflare's", "See GitHub's", "in the public repository"]) {
      await expect(main).toContainText(text);
    }
    // Fonts are self-hosted, so Google is not a processor.
    await expect(main).not.toContainText("Google");
    // Public by design: a check records the GitHub username.
    await expect(main).toContainText("your GitHub username");
    await expect(main.getByRole("heading", { level: 2, name: "How long we keep it" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
  });

  test("privacy says analytics are off when the build has no token", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("[data-analytics]")).toHaveAttribute("data-analytics", "off");
    await expect(page.locator("[data-analytics]")).toContainText("No analytics");
  });

  test("terms: not advice, as is, and the license", async ({ page }) => {
    await page.goto("/terms");
    const main = page.locator("main");
    await expect(main).toContainText("Not advice");
    await expect(main).toContainText("as is");
    await expect(main.getByRole("link", { name: "MIT License" })).toHaveAttribute("href", /\/blob\/main\/LICENSE$/);
    await expect(main.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  });

  test("contact routes each kind of request", async ({ page }) => {
    await page.goto("/contact");
    const main = page.locator("main");
    await expect(main.getByRole("link", { name: "Add a tool" })).toHaveAttribute("href", "/add");
    await expect(main.getByRole("link", { name: /Open an issue/ }).first()).toHaveAttribute(
      "href",
      "https://github.com/freestackhq/freestack/issues/new",
    );
  });

  test("contact shows no made-up address when none is set", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("[data-contact-email]")).toHaveCount(0);
    await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(0);
  });
});

test.describe("legal pages on a phone", () => {
  test.use({ viewport: PHONE });

  for (const { path } of PAGES) {
    test(`${path} reflows without side scroll`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoSideScroll(page);
    });
  }
});
