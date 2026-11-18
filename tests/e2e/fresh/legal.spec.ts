import { expect, test } from "@playwright/test";
import { DESKTOP, PHONE, expectNoSideScroll } from "./helpers";

/*
 * Privacy, Terms and Contact. All contact is public, on GitHub: no email
 * anywhere. The test build has no PUBLIC_CF_ANALYTICS_TOKEN.
 */
const PRIVACY_ISSUE = "https://github.com/freestackhq/freestack/issues/new?title=Privacy+request%3A+";
const PAGES = [
  { path: "/privacy", h1: "Privacy" },
  { path: "/terms", h1: "Terms" },
  { path: "/contact", h1: "Contact" },
];

test.describe("legal and contact pages", () => {
  test.use({ viewport: DESKTOP });

  for (const { path, h1 } of PAGES) {
    test(`${path} renders with status 200 and its heading`, async ({ page }) => {
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

  test("privacy names who sees what, with each policy", async ({ page }) => {
    await page.goto("/privacy");
    const main = page.locator("main");
    await expect(main).toContainText("No accounts, no cookies, nothing stored about you.");
    await expect(main.getByRole("link", { name: "Cloudflare's privacy policy" })).toHaveAttribute(
      "href",
      /cloudflare\.com/,
    );
    await expect(main.getByRole("link", { name: "GitHub's privacy statement" })).toHaveAttribute("href", /github\.com/);
    // A check records the GitHub username in public data.
    await expect(main).toContainText("adds your GitHub username to the label");
    // Fonts are self-hosted, so Google is not a processor.
    await expect(main).not.toContainText("Google");
    // A link that starts a source line keeps the space before it.
    await expect(main).toContainText("we keep none. Cloudflare's");
    await expect(main).toContainText("non-commercial, open-source project");
  });

  test("privacy says analytics are off when the build has no token", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("[data-analytics]")).toHaveAttribute("data-analytics", "off");
    await expect(page.locator("[data-analytics]")).toHaveText("No analytics.");
  });

  test("privacy: removing a username is a prefilled public issue", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("main").getByRole("link", { name: "Open a privacy request" })).toHaveAttribute(
      "href",
      PRIVACY_ISSUE,
    );
  });

  test("terms: not advice, as is, license, trademarks", async ({ page }) => {
    await page.goto("/terms");
    const main = page.locator("main");
    for (const h of ["Not advice", "As is", "License", "Names and trademarks"]) {
      await expect(main.getByRole("heading", { level: 2, name: h })).toBeVisible();
    }
    await expect(main.getByRole("link", { name: "MIT License" })).toHaveAttribute("href", /\/blob\/main\/LICENSE$/);
    await expect(main.getByRole("link", { name: "open an issue" })).toHaveAttribute(
      "href",
      "https://github.com/freestackhq/freestack/issues/new",
    );
    await expect(main.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  });

  test("contact routes each kind of request", async ({ page }) => {
    await page.goto("/contact");
    const main = page.locator("main");
    await expect(main.getByRole("link", { name: "Add a tool" })).toHaveAttribute("href", "/add");
    await expect(main.getByRole("link", { name: "Open an issue" })).toHaveAttribute(
      "href",
      "https://github.com/freestackhq/freestack/issues/new",
    );
    await expect(main.getByRole("link", { name: "Open a privacy request" })).toHaveAttribute("href", PRIVACY_ISSUE);
  });

  test("no email anywhere: every request is public on GitHub", async ({ page }) => {
    for (const path of ["/contact", "/privacy", "/terms"]) {
      await page.goto(path);
      await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
      await expect(page.locator("main")).not.toContainText("@");
    }
    await page.goto("/contact");
    await expect(page.locator("main")).toContainText("There's no email");
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
