import { describe, expect, it } from "vitest";

import {
  CATALOGS,
  aisleForCategory,
  buildClaimPlan,
  catalogsMeta,
  findTool,
  legacyHomeRedirect,
  legacyPath,
  queryEntries,
  queryTools,
} from "./catalog";
import { snapshot } from "./fresh/catalog";

const snap = snapshot();

describe("old catalogs as aliases for the aisle groups", () => {
  it("keeps the three catalog ids", () => {
    expect(CATALOGS.map((c) => c.id)).toEqual(["saas", "apis", "llm-ai"]);
    expect(catalogsMeta().reduce((n, c) => n + c.count, 0)).toBe(snap.tools.length);
  });

  it("?catalog= filters to that catalog's groups", () => {
    const ai = queryEntries({ catalog: "llm-ai" });
    expect(ai.count).toBeGreaterThan(0);
    for (const e of ai.entries) expect(e.group).toBe("AI");
    const apis = queryEntries({ catalog: "apis" });
    for (const e of apis.entries) expect(e.group).toBe("Free and Open Data");
    expect(queryEntries({ catalog: "nope" }).count).toBe(0);
  });

  it("?category= takes an aisle id or an old category id", () => {
    expect(aisleForCategory("databases")).toBe("databases");
    expect(aisleForCategory("student")).toBe("student-programs");
    expect(aisleForCategory("startup")).toBe("team");
    const db = queryEntries({ catalog: "saas", category: "databases", q: "neon" });
    expect(db.entries.map((e) => e.tool)).toContain("neon");
  });
});

describe("entry shape", () => {
  const neon = queryEntries({ q: "neon", aisle: "databases" }).entries.find((e) => e.tool === "neon")!;

  it("keeps the old fields", () => {
    expect(neon.id).toBe("saas/databases/neon");
    expect(neon.catalog).toBe("saas");
    expect(neon.category).toBe("databases");
    expect(neon.name).toBe("Neon");
    expect(neon.url).toMatch(/^https:/);
    expect(neon.fields.Limits).toContain("1 GB storage per project");
    expect(neon.fields.Commercial).toBe("commercial ok");
    expect(neon.fields.Cost).toBe("free forever");
    expect(Array.isArray(neon.prose)).toBe(true);
    expect(Array.isArray(neon.alternatives)).toBe(true);
  });

  it("adds the label fields", () => {
    expect(neon.metric).toBe(1);
    expect(neon.metric_key).toBe("storage_gb");
    expect(neon.href).toBe("/databases/neon");
    expect(neon.sell).toBe("yes");
    expect(["checked", "unchecked", "overdue", "review", "vendor-changed"]).toContain(neon.label_state);
  });

  it("old field filters still work", () => {
    const r = queryEntries({ catalog: "saas", filters: { cost: ["free forever"], commercial: ["commercial ok"] } });
    expect(r.count).toBeGreaterThan(0);
    for (const e of r.entries) expect(e.fields.Cost).toBe("free forever");
  });

  it("applies a limit and keeps the full count", () => {
    const r = queryEntries({ catalog: "saas", limit: 5 });
    expect(r.entries).toHaveLength(5);
    expect(r.count).toBeGreaterThan(5);
  });

  it("imported entries carry no numbers", () => {
    const imported = queryEntries({}).entries.filter((e) => e.source === "imported");
    for (const e of imported) {
      expect(e.metric).toBeNull();
      expect(e.limits).toEqual([]);
      expect(e.imported_from).toBeTruthy();
    }
  });
});

describe("old URLs", () => {
  it("maps every old catalog page to a page that exists", () => {
    const aisles = new Set(snap.aisles.map((a) => a.id));
    const tools = new Set(snap.tools.map((t) => `${t.aisle}/${t.id}`));
    expect(legacyPath([])).toBe("/");
    // A removed tool's old page goes straight to its aisle.
    const removed = new Set(snap.removed.map((r) => r.id));
    for (const [key, path] of Object.entries(snap.legacy.entries)) {
      expect(legacyPath(key.split("/"))).toBe(path);
      const ok = tools.has(path.slice(1)) || (removed.has(key.split("/").pop() ?? "") && aisles.has(path.slice(1)));
      expect(ok, key).toBe(true);
    }
    for (const [key, path] of Object.entries(snap.legacy.categories)) {
      expect(legacyPath(key.split("/"))).toBe(path);
      expect(aisles.has(path.slice(1)), key).toBe(true);
    }
    expect(legacyPath(["saas", "databases", "not-a-tool"])).toBeNull();
  });

  it("every migrated catalog entry has a redirect", () => {
    expect(Object.keys(snap.legacy.entries).length).toBe(223);
  });

  it("/?hint= and /?catalog= go to the matching aisle", () => {
    expect(legacyHomeRedirect(new URLSearchParams("hint=ai"))).toBe("/inference");
    expect(legacyHomeRedirect(new URLSearchParams("hint=startup"))).toBe("/team");
    expect(legacyHomeRedirect(new URLSearchParams("catalog=llm-ai"))).toBe("/inference");
    expect(legacyHomeRedirect(new URLSearchParams("catalog=saas"))).toBe("/#aisles-h");
    expect(legacyHomeRedirect(new URLSearchParams("as=student"))).toBeNull();
    expect(legacyHomeRedirect(new URLSearchParams("hint=nope"))).toBeNull();
  });
});

describe("CLI endpoints (@kuyacarlo/freestack 0.1)", () => {
  it("tools: flat shape the CLI prints", () => {
    const r = queryTools(new URLSearchParams("category=databases&commercial=yes&limit=3"));
    expect(r.tools.length).toBeLessThanOrEqual(3);
    for (const t of r.tools) {
      expect(typeof t.blurb).toBe("string");
      expect(typeof t.limits).toBe("string");
      expect(t.commercial).toBe("commercial ok");
      expect(t.aisle).toBe("databases");
    }
  });

  it("tool by new id or old slug", () => {
    expect(findTool("neon")?.id).toBe("neon");
    expect(findTool("cloudflare-d1")?.id).toBe("d1");
    expect(findTool("nope")).toBeUndefined();
  });

  it("claim plan lists Claim Once programs in order", () => {
    const plan = buildClaimPlan({ student: true, commercial: false, ph: false, ai: false }, "https://example.test");
    expect(plan.steps[0].title).toBe("Student programs");
    expect(plan.steps[0].href).toBe("https://example.test/student-programs");
    expect(plan.steps[0].tools[0].name).toBeTruthy();
    const selling = buildClaimPlan({ student: true, commercial: true, ph: false, ai: false }, "https://example.test");
    const names = selling.steps.flatMap((s) => s.tools.map((t) => t.id));
    for (const id of names) expect(snap.tools.find((t) => t.id === id)!.sell).not.toBe("no");
  });
});
