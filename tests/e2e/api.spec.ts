import { expect, test } from "@playwright/test";

test("GET /api/catalogs returns metadata for both catalogs", async ({ request }) => {
  const res = await request.get("/api/catalogs");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);
  const ids = body.catalogs.map((c: any) => c.id);
  expect(ids).toContain("selfhosted");
  expect(ids).toContain("saas");
  const saas = body.catalogs.find((c: any) => c.id === "saas");
  expect(saas.count).toBeGreaterThanOrEqual(150);
});

test("GET /api/entries?meta=1 lists catalogs", async ({ request }) => {
  const res = await request.get("/api/entries?meta=1");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(body.catalogs.length).toBe(2);
});

test("GET /api/entries filters by catalog, category, and q", async ({ request }) => {
  const res = await request.get("/api/entries?catalog=saas&category=databases&q=neon");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.count).toBeGreaterThanOrEqual(1);
  const neon = body.entries.find((e: any) => e.name === "Neon");
  expect(neon).toBeTruthy();
  expect(neon.id).toBe("saas/databases/neon");
  expect(neon.fields.Limits).toBeTruthy();
});

test("GET /api/entries applies field filters", async ({ request }) => {
  const res = await request.get(
    "/api/entries?catalog=saas&cost=free%20forever&commercial=commercial%20ok",
  );
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.count).toBeGreaterThan(0);
  for (const e of body.entries) {
    expect(e.fields.Cost).toBe("free forever");
  }
});

test("POST /api/entries accepts a JSON body", async ({ request }) => {
  const res = await request.post("/api/entries", {
    data: { catalog: "selfhosted", category: "databases", limit: 2 },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.entries.length).toBe(2);
  expect(body.entries[0].catalog).toBe("selfhosted");
});

test("GET /api/entries respects limit", async ({ request }) => {
  const res = await request.get("/api/entries?catalog=saas&limit=5");
  const body = await res.json();
  expect(body.entries.length).toBe(5);
  expect(body.count).toBeGreaterThan(5);
});

test("POST /api/entries with invalid body returns 400", async ({ request }) => {
  const res = await request.post("/api/entries", { data: "not json" });
  expect(res.status()).toBe(400);
});