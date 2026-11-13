import { expect, test } from "@playwright/test";

/* Every old URL pattern answers with a 301 to its new page (fixture legacy map). */

const cases: [string, RegExp][] = [
  ["/catalogs", /\/$/],
  ["/catalogs/saas", /\/#aisles-h$/],
  ["/catalogs/llm-ai", /\/inference$/],
  ["/catalogs/saas/databases", /\/databases$/],
  ["/catalogs/saas/databases/neon", /\/databases\/neon$/],
  ["/catalogs/saas/databases/cloudflare-d1", /\/databases\/d1$/],
  ["/?hint=databases", /\/databases$/],
  ["/?catalog=llm-ai", /\/inference$/],
  ["/guides/claim-order", /\/student-programs$/],
  ["/guides/stacks", /\/$/],
];

for (const [from, to] of cases) {
  test(`${from} -> 301`, async ({ request }) => {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers()["location"]).toMatch(to);
  });
}

test("an old URL that never existed is a 404", async ({ request }) => {
  const res = await request.get("/catalogs/saas/databases/not-a-tool", { maxRedirects: 0 });
  expect(res.status()).toBe(404);
});

test("Home without old params renders, and the startup guide stays a page", async ({ request }) => {
  expect((await request.get("/?as=student", { maxRedirects: 0 })).status()).toBe(200);
  expect((await request.get("/guides/startup", { maxRedirects: 0 })).status()).toBe(200);
});
