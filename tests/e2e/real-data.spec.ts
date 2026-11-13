import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { PHONE, expectNoSideScroll } from "./fresh/helpers";

/*
 * Smoke test on the real catalog (the committed snapshot, built to
 * dist-real/ and served on REAL_PORT by scripts/e2e-server.mjs): every aisle
 * page and every tool page loads and never scrolls sideways at 390px.
 */
const snap = JSON.parse(readFileSync(join(process.cwd(), "src/data/catalog.generated.json"), "utf8"));
const pages: string[] = [
  ...snap.aisles.map((a: { id: string }) => `/${a.id}/`),
  ...snap.tools.map((t: { aisle: string; id: string }) => `/${t.aisle}/${t.id}/`),
];

test.use({ viewport: PHONE });

// A few pages per test keeps the run fast without hiding which page failed.
const CHUNK = 12;
for (let i = 0; i < pages.length; i += CHUNK) {
  const chunk = pages.slice(i, i + CHUNK);
  test(`real data pages ${i + 1}-${i + chunk.length} load at 390px`, async ({ page }) => {
    for (const path of chunk) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.locator("h1").first(), path).toBeVisible();
      await expectNoSideScroll(page);
    }
  });
}

test("covers every aisle and tool", () => {
  expect(snap.aisles.length).toBeGreaterThanOrEqual(31);
  expect(pages.length).toBe(snap.aisles.length + snap.tools.length);
});
