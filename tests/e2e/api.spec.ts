import { expect, test } from "@playwright/test";

test("GET /api/catalogs returns metadata for all catalogs", async ({ request }) => {
  const res = await request.get("/api/catalogs");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);
  const ids = body.catalogs.map((c: any) => c.id);
  expect(ids).toEqual(["saas", "apis", "llm-ai"]);
  const saas = body.catalogs.find((c: any) => c.id === "saas");
  expect(saas.count).toBeGreaterThanOrEqual(150);
});

test("LLM discovery files describe the audience paths and catalog limits", async ({ request }) => {
  const indexResponse = await request.get("/llms.txt");
  expect(indexResponse.ok()).toBeTruthy();
  const index = await indexResponse.text();
  expect(index).toContain("[Launch a lean MVP]");
  expect(index).toContain("[Publish a portfolio project]");
  expect(index).toContain("[Build for yourself]");
  expect(index).toContain("not rankings or personalized recommendations");

  const fullResponse = await request.get("/llms-full.txt");
  expect(fullResponse.ok()).toBeTruthy();
  const full = await fullResponse.text();
  expect(full).toContain("Snapshot generated:");
  expect(full).toContain("no separate self-hosted catalog");
});

test("GET /api/entries?meta=1 lists catalogs", async ({ request }) => {
  const res = await request.get("/api/entries?meta=1");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(body.catalogs.length).toBe(3);
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
    data: { catalog: "llm-ai", category: "inference", limit: 2 },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.entries.length).toBe(2);
  expect(body.entries[0].catalog).toBe("llm-ai");
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
