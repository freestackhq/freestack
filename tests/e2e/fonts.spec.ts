import { expect, test } from "@playwright/test";

// Archivo is self-hosted from /fonts, so no page may contact Google.
test.describe("fonts", () => {
  for (const path of ["/", "/privacy", "/no-such-page"]) {
    test(`loads Archivo from this site only: ${path}`, async ({ page }) => {
      const google: string[] = [];
      const fonts: string[] = [];
      page.on("request", (r) => {
        if (/googleapis\.com|gstatic\.com/.test(r.url())) google.push(r.url());
        if (r.resourceType() === "font") fonts.push(new URL(r.url()).pathname);
      });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.fonts.check('900 40px "Archivo"'))).toBe(true);
      expect(google).toEqual([]);
      expect(fonts.length).toBeGreaterThan(0);
      for (const f of fonts) expect(f).toMatch(/^\/fonts\/archivo-[a-z-]+\.woff2$/);
    });
  }

  test("ships the font license next to the files", async ({ request }) => {
    const res = await request.get("/fonts/Archivo-OFL.txt");
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain("SIL Open Font License");
  });
});
