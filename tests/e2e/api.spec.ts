import { expect, test } from "@playwright/test";

/* The public API on the fixture build: new snapshot, old shapes kept. */

test("GET /api/catalogs lists the old catalogs as aliases and the aisles", async ({ request }) => {
  const res = await request.get("/api/catalogs");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.catalogs.map((c: { id: string }) => c.id)).toEqual(["saas", "apis", "llm-ai"]);
  expect(body.aisles.find((a: { id: string }) => a.id === "databases").metric).toBe("storage_gb");
});

test("GET /api/entries?meta=1 lists catalogs", async ({ request }) => {
  const body = await (await request.get("/api/entries?meta=1")).json();
  expect(body.ok).toBe(true);
  expect(body.catalogs).toHaveLength(3);
});

test("GET /api/entries?catalog= is an alias for the aisle groups", async ({ request }) => {
  const body = await (await request.get("/api/entries?catalog=llm-ai")).json();
  expect(body.count).toBeGreaterThan(0);
  for (const e of body.entries) {
    expect(e.group).toBe("AI");
    expect(e.catalog).toBe("llm-ai");
  }
});

test("GET /api/entries keeps the old fields and adds label fields", async ({ request }) => {
  const body = await (await request.get("/api/entries?catalog=saas&category=databases&q=neon")).json();
  const neon = body.entries.find((e: { name: string }) => e.name === "Neon");
  expect(neon).toBeTruthy();
  // old
  expect(neon.category).toBe("databases");
  expect(neon.fields.Limits).toBeTruthy();
  expect(typeof neon.pick).toBe("string");
  expect(Array.isArray(neon.alternatives)).toBe(true);
  // new
  expect(neon.tool).toBe("neon");
  expect(neon.href).toBe("/databases/neon");
  expect(neon.metric).toBe(0.5);
  expect(neon.label_state).toBe("checked");
});

test("GET /api/entries applies field filters and limit", async ({ request }) => {
  const body = await (await request.get("/api/entries?commercial=commercial%20ok&limit=2")).json();
  expect(body.entries).toHaveLength(2);
  expect(body.count).toBeGreaterThan(2);
  for (const e of body.entries) expect(e.fields.Commercial).toBe("commercial ok");
});

test("POST /api/entries accepts a JSON body; a bad body is 400", async ({ request }) => {
  const ok = await request.post("/api/entries", { data: { aisle: "hosting", limit: 1 } });
  expect((await ok.json()).entries[0].aisle).toBe("hosting");
  const bad = await request.post("/api/entries", { data: "not json" });
  expect(bad.status()).toBe(400);
});

test("CLI endpoints: /api/tools, /api/tools/<id>, /api/claim, /api/health", async ({ request }) => {
  const tools = await (await request.get("/api/tools?category=databases&commercial=yes")).json();
  expect(tools.count).toBeGreaterThan(0);
  expect(typeof tools.tools[0].blurb).toBe("string");
  const neon = await (await request.get("/api/tools/neon")).json();
  expect(neon.tool.name).toBe("Neon");
  expect((await request.get("/api/tools/not-a-tool")).status()).toBe(404);
  const claim = await (await request.get("/api/claim?student=1")).json();
  expect(claim.steps[0].tools.length).toBeGreaterThan(0);
  const health = await (await request.get("/api/health")).json();
  expect(health.tools).toBeGreaterThan(0);
});

test("llms.txt and llms-full.txt come from the snapshot", async ({ request }) => {
  const txt = await (await request.get("/llms.txt")).text();
  expect(txt).toContain("## Build");
  expect(txt).toContain("/databases)");
  expect(txt).toContain("MCP server");
  const full = await (await request.get("/llms-full.txt")).text();
  expect(full).toContain("#### Neon");
  expect(full).not.toContain("/catalogs/");
});
