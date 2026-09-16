import { describe, expect, it } from "vitest";

import {
  CATALOGS,
  allEntries,
  entryId,
  filterOptions,
  getCatalog,
  getEntry,
  queryCategories,
  queryEntries,
} from "./catalog";

describe("catalog data layer (snapshot)", () => {
  it("loads catalogs from the generated snapshot", () => {
    expect(CATALOGS.length).toBe(3);
    expect(CATALOGS.map((c) => c.id)).toEqual(["saas", "apis", "llm-ai"]);
  });

  it("getCatalog resolves by id", () => {
    expect(getCatalog("saas")?.label).toBe("SaaS");
    expect(getCatalog("nope")).toBeNull();
  });

  it("saas catalog preserves original tool ids", () => {
    const c = getCatalog("saas")!;
    const total = c.categories.reduce((n, cat) => n + cat.entries.length, 0);
    expect(total).toBeGreaterThanOrEqual(150);
    const neon = c.categories.find((x) => x.id === "databases")?.entries.find((e) => e.slug === "neon");
    expect(neon?.fields.Limits).toBeTruthy();
  });

  it("apis catalog has categories and entries", () => {
    const c = getCatalog("apis")!;
    expect(c.categories.length).toBe(6);
    const weather = c.categories.find((x) => x.id === "weather");
    expect(weather?.entries.some((e) => e.slug === "open-meteo")).toBe(true);
  });

  it("getEntry resolves a full path", () => {
    expect(getEntry("saas", "databases", "neon")?.name).toBe("Neon");
    expect(getEntry("saas", "databases", "missing")).toBeNull();
  });

  it("entryId builds stable global ids", () => {
    expect(entryId("saas", "databases", "neon")).toBe("saas/databases/neon");
  });

  it("allEntries flattens with catalog+category context", () => {
    const rows = allEntries();
    expect(rows.length).toBeGreaterThanOrEqual(200);
    const neon = rows.find((r) => r.entry.slug === "neon" && r.catalog.id === "saas");
    expect(neon?.category.id).toBe("databases");
  });
});

describe("filterOptions", () => {
  it("derives distinct single-select values", () => {
    const c = getCatalog("saas")!;
    const costs = filterOptions(c, "cost", "single");
    expect(costs).toEqual(["credits", "discount", "free forever", "student free"]);
  });

  it("derives distinct filter options for apis", () => {
    const c = getCatalog("apis")!;
    const auth = filterOptions(c, "auth", "single");
    expect(auth).toContain("api-key");
    expect(auth).toContain("none");
  });
});

describe("queryEntries", () => {
  it("searches across catalogs by query", () => {
    const r = queryEntries({ q: "neon" });
    expect(r.count).toBeGreaterThan(0);
    expect(r.entries.some((e) => e.id === "saas/databases/neon")).toBe(true);
    expect(r.entries.some((e) => e.name === "Neon")).toBe(true);
  });

  it("filters by catalog and category", () => {
    const r = queryEntries({ catalog: "saas", category: "databases" });
    expect(r.entries.length).toBeGreaterThan(0);
    expect(r.entries.every((e) => e.catalog === "saas" && e.category === "databases")).toBe(true);
  });

  it("filters on field values (single-select)", () => {
    const r = queryEntries({
      catalog: "saas",
      filters: { cost: ["free forever"], commercial: ["commercial ok"] },
    });
    expect(r.count).toBeGreaterThan(0);
    expect(r.entries.every((e) => e.fields.Cost === "free forever")).toBe(true);
  });

  it("applies a limit", () => {
    const r = queryEntries({ catalog: "saas", limit: 3 });
    expect(r.entries).toHaveLength(3);
    expect(r.count).toBeGreaterThan(3);
  });

  it("combines query + filters", () => {
    const r = queryEntries({ catalog: "saas", q: "neon", filters: { cost: ["free forever"] } });
    expect(r.entries.some((e) => e.name === "Neon")).toBe(true);
  });

  it("returns empty for a miss", () => {
    const r = queryEntries({ q: "zzzzzz-nothing-here" });
    expect(r.count).toBe(0);
    expect(r.entries).toEqual([]);
  });
});

describe("queryCategories", () => {
  it("returns categories with entry counts", () => {
    const cats = queryCategories("saas");
    expect(cats.length).toBe(17);
    expect(cats[0].label).toBe("Databases");
    expect(cats[0].entryCount).toBeGreaterThan(0);
    expect(queryCategories("nope")).toEqual([]);
  });
});