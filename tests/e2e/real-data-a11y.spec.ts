import { expect, test } from "@playwright/test";
import { DESKTOP, PHONE, SCALAR, audit, missingFocusRings, smallTargets, structureProblems } from "./a11y";

/*
 * Accessibility pass (issue 7.1) on the real catalog. These are the
 * prerendered pages (the real-data server has no on-demand routes; home,
 * compare, add, 404 and 500 are covered on the fixture build in
 * fresh/a11y.spec.ts). axe finds no serious or critical WCAG A/AA problem
 * at desktop and phone widths, focus is always visible, targets are 44px.
 */
const PAGES = [
  "/databases/",
  "/hosting/",
  "/databases/neon/",
  "/databases/aiven/", // imported tool, no label yet
  "/databases/neon/check",
  "/build?as=indie&hosting=cf-workers&database=neon",
  "/check",
  "/student-programs/", // Claim Once aisle
  "/cloud-credits/",
  "/catches/can-i-sell-on-vercel-hobby",
  "/agents",
  "/guides/startup",
  "/docs",
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
        const exclude = path === "/docs" ? [SCALAR] : [];
        await audit(page, `${name} ${path}`, { exclude });
        expect(await structureProblems(page), `${name} ${path} structure`).toEqual([]);
        if (name === "phone") expect(await smallTargets(page), `${path} targets`).toEqual([]);
      });
    }

    test("search overlay", async ({ page }) => {
      await page.goto("/databases/");
      await page.keyboard.press("Control+k");
      const dialog = page.getByRole("dialog", { name: "Search" });
      await expect(dialog).toBeVisible();
      await page.keyboard.type("postgres");
      await expect(dialog.getByRole("option").first()).toBeVisible();
      await audit(page, `${name} search`);
      if (name === "phone") expect(await smallTargets(page, "#search-dialog")).toEqual([]);
    });
  });
}

test.describe("focus is always visible", () => {
  test.use({ viewport: DESKTOP });
  for (const path of ["/databases/", "/databases/neon/", "/databases/neon/check", "/build", "/check", "/student-programs/", "/agents"]) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(await missingFocusRings(page, 80)).toEqual([]);
    });
  }
});

test("labels give screen readers a sentence for the scale, the facts and the state", async ({ page }) => {
  await page.goto("/databases/");
  const labels = page.locator("article.label");
  expect(await labels.count()).toBeGreaterThan(3);
  for (const label of (await labels.all()).slice(0, 12)) {
    const scale = label.locator(".scale");
    if (await scale.count()) {
      const said = await scale.evaluate((el) => el.querySelector('[role="img"]')?.getAttribute("aria-label") ?? el.querySelector(".sr-only")?.textContent);
      expect(said).toMatch(/^[A-Z].*\.$/);
    }
    const facts = label.locator(".facts .sr-only");
    for (const s of await facts.allTextContents()) expect(s.trim()).toMatch(/^[A-Z].*\.$/);
    await expect(label.locator(".strip")).not.toHaveText("");
  }
});
