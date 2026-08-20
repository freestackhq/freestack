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
  it("loads both catalogs from the generated snapshot", () => {
    expect(CATALOGS.length).toBe(2);
    expect(CATALOGS.map((c) => c.id)).toEqual(["selfhosted", "free-tools"]);
  });

  it("getCatalog resolves by id", () => {
    expect(getCatalog("selfhosted")?.label).toBe("Self-hosted");
    expect(getCatalog("nope")).toBeNull();
  });

  it("selfhosted catalog has real categories and entries", () => {
    const c = getCatalog("selfhosted")!;
    const total = c.categories.reduce((n, cat) => n + cat.entries.length, 0);
    expect(c.categories.length).toBeGreaterThanOrEqual(25);
    expect(total).toBeGreaterThanOrEqual(100);
    const db = c.categories.find((x) => x.id === "databases")!;
    expect(db.entries.some((e) => e.slug === "postgresql")).toBe(true);
  });

  it("free-tools catalog preserves original tool ids", () => {
    const c = getCatalog("free-tools")!;
    const total = c.categories.reduce((n, cat) => n + cat.entries.length, 0);
    expect(total).toBeGreaterThanOrEqual(150);
    const neon = c.categories.find((x) => x.id === "databases")?.entries.find((e) => e.slug === "neon");
    expect(neon?.fields.Limits).toBeTruthy();
  });

  it("getEntry resolves a full path", () => {
    expect(getEntry("selfhosted", "databases", "postgresql")?.name).toBe("PostgreSQL");
    expect(getEntry("selfhosted", "databases", "missing")).toBeNull();
  });

  it("entryId builds stable global ids", () => {
    expect(entryId("free-tools", "databases", "neon")).toBe("free-tools/databases/neon");
  });

  it("allEntries flattens with catalog+category context", () => {
    const rows = allEntries();
    expect(rows.length).toBeGreaterThanOrEqual(300);
    const neon = rows.find((r) => r.entry.slug === "neon" && r.catalog.id === "free-tools");
    expect(neon?.category.id).toBe("databases");
  });
});

describe("filterOptions", () => {
  it("derives distinct single-select values", () => {
    const c = getCatalog("free-tools")!;
    const costs = filterOptions(c, "cost", "single");
    expect(costs).toEqual(["credits", "discount", "free forever", "student free"]);
  });

  it("derives distinct multiselect tokens", () => {
    const c = getCatalog("selfhosted")!;
    const deploys = filterOptions(c, "deploy", "multiselect");
    expect(deploys).toContain("docker");
    expect(deploys).toContain("binary");
    expect(deploys).toContain("helm");
  });

  it("ignores n/a tokens in multiselect", () => {
    const c = getCatalog("selfhosted")!;
    const maintained = filterOptions(c, "maintained", "single");
    expect(maintained).not.toContain("n/a");
  });
});

describe("queryEntries", () => {
  it("searches across catalogs by query", () => {
    const r = queryEntries({ q: "postgresql" });
    expect(r.count).toBeGreaterThan(0);
    expect(r.entries.some((e) => e.id === "selfhosted/databases/postgresql")).toBe(true);
    expect(r.entries.some((e) => e.name === "PostgreSQL")).toBe(true);
  });

  it("filters by catalog and category", () => {
    const r = queryEntries({ catalog: "selfhosted", category: "databases" });
    expect(r.entries.length).toBeGreaterThan(0);
    expect(r.entries.every((e) => e.catalog === "selfhosted" && e.category === "databases")).toBe(true);
  });

  it("filters on field values (single-select)", () => {
    const r = queryEntries({
      catalog: "free-tools",
      filters: { cost: ["free forever"], commercial: ["commercial ok"] },
    });
    expect(r.count).toBeGreaterThan(0);
    expect(r.entries.every((e) => e.fields.Cost === "free forever")).toBe(true);
  });

  it("filters on field values (multiselect token match)", () => {
    const r = queryEntries({
      catalog: "selfhosted",
      filters: { deploy: ["docker"], maintained: ["active"] },
    });
    expect(r.count).toBeGreaterThan(0);
  });

  it("applies a limit", () => {
    const r = queryEntries({ catalog: "free-tools", limit: 3 });
    expect(r.entries).toHaveLength(3);
    expect(r.count).toBeGreaterThan(3);
  });

  it("combines query + filters", () => {
    const r = queryEntries({ catalog: "free-tools", q: "neon", filters: { cost: ["free forever"] } });
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
    const cats = queryCategories("free-tools");
    expect(cats.length).toBe(17);
    expect(cats[0].label).toBe("Databases");
    expect(cats[0].entryCount).toBeGreaterThan(0);
    expect(queryCategories("nope")).toEqual([]);
  });
});