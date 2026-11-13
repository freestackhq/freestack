import { expect, test } from "@playwright/test";

// The test build has no PUBLIC_CF_ANALYTICS_TOKEN, so no page may load the beacon.
test.describe("analytics", () => {
  for (const path of ["/", "/docs", "/check"]) {
    test(`ships no beacon without a token: ${path}`, async ({ page }) => {
      const beacons: string[] = [];
      page.on("request", (r) => {
        if (r.url().includes("cloudflareinsights.com")) beacons.push(r.url());
      });
      await page.goto(path);
      await expect(page.locator("title")).toHaveCount(1);
      await expect(page.locator("script[data-cf-beacon], script[src*='cloudflareinsights']")).toHaveCount(0);
      expect(beacons).toEqual([]);
    });
  }
});
