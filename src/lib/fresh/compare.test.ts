import { describe, expect, it } from "vitest";
import {
  aisleSplit,
  compareHref,
  isUnknownCell,
  listJoin,
  parseIds,
  questionFor,
  resolve,
  rows,
  withAdded,
  withRemoved,
  withSwapped,
} from "./compare";
import type { Aisle, Tool } from "./types";

const NOW = new Date("2026-11-13T12:00:00Z");
const db: Aisle = {
  id: "databases",
  group: "Build",
  name: "Databases",
  metric: "storage_gb",
  unit: "GB",
  label: "free storage",
};

function make(over: Partial<Tool>): Tool {
  return {
    id: "x",
    name: "X",
    kind: "Thing",
    url: "https://x.test",
    aisle: "databases",
    metric: 1,
    limits: [],
    who: ["anyone"],
    region: null,
    sell: "yes",
    card: "no",
    catches: [],
    use_if: [],
    skip_if: [],
    pricing_url: "https://x.test/pricing",
    verified_at: null,
    verified_by: null,
    source: "catalog",
    ...over,
  };
}

describe("ids in the URL", () => {
  it("parses, trims, lowercases and dedupes", () => {
    expect(parseIds(" neon, Turso,,neon ")).toEqual(["neon", "turso"]);
    expect(parseIds(null)).toEqual([]);
  });

  it("builds hrefs with literal commas", () => {
    expect(compareHref(["neon", "turso"])).toBe("/compare?ids=neon,turso");
    expect(compareHref(["neon"], { only: true })).toBe("/compare?ids=neon&only=differs");
    expect(compareHref([])).toBe("/compare");
  });

  it("adds up to four, never twice", () => {
    expect(withAdded(["a"], "b")).toEqual(["a", "b"]);
    expect(withAdded(["a", "b"], "a")).toEqual(["a", "b"]);
    expect(withAdded(["a", "b", "c", "d"], "e")).toEqual(["a", "b", "c", "d"]);
  });

  it("removes", () => {
    expect(withRemoved(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("swaps a column, trading places when the tool is already shown", () => {
    expect(withSwapped(["a", "b"], 0, "c")).toEqual(["c", "b"]);
    expect(withSwapped(["a", "b"], 0, "b")).toEqual(["b", "a"]);
    expect(withSwapped(["a", "b"], 5, "c")).toEqual(["a", "b"]);
  });
});

describe("resolve", () => {
  const known = new Map(["a", "b", "c", "d", "e"].map((id) => [id, make({ id })]));
  it("drops ids that are not in the catalog", () => {
    const s = resolve(["a", "gone", "b"], (id) => known.get(id));
    expect(s.tools.map((t) => t.id)).toEqual(["a", "b"]);
    expect(s.dropped).toEqual(["gone"]);
    expect(s.capped).toBe(false);
  });
  it("keeps the first four", () => {
    const s = resolve(["a", "b", "c", "d", "e"], (id) => known.get(id));
    expect(s.tools).toHaveLength(4);
    expect(s.capped).toBe(true);
  });
});

describe("copy helpers", () => {
  it("asks the question", () => {
    expect(questionFor(["Neon", "Turso"])).toBe("Neon or Turso?");
    expect(questionFor(["Neon", "Turso", "Supabase"])).toBe("Neon, Turso or Supabase?");
  });
  it("joins lists", () => {
    expect(listJoin(["a"])).toBe("a");
    expect(listJoin(["a", "b", "c"])).toBe("a, b and c");
  });
});

describe("aisleSplit", () => {
  it("keeps the aisle with the most picks", () => {
    const tools = [make({ id: "v", aisle: "hosting" }), make({ id: "a" }), make({ id: "b" })];
    const s = aisleSplit(tools);
    expect(s.main).toBe("databases");
    expect(s.others.map((t) => t.id)).toEqual(["v"]);
  });
  it("ties go to the first pick", () => {
    expect(aisleSplit([make({ aisle: "hosting" }), make({})]).main).toBe("hosting");
  });
});

describe("rows", () => {
  it("marks rows that differ, never Pick it if", () => {
    const a = make({ id: "a", card: "no", use_if: ["One"] });
    const b = make({ id: "b", card: "unknown", use_if: ["Two"] });
    const r = rows([a, b], db, NOW);
    const by = (l: string) => r.find((x) => x.label === l)!;
    expect(by("Credit card").diff).toBe(true);
    expect(by("Can sell").diff).toBe(false);
    expect(by("Pick it if").diff).toBe(false);
    expect(by("Free storage").headline).toBe(true);
  });

  it("says Unknown, never guesses", () => {
    const t = make({ sell: "unknown", card: "unknown", metric: null });
    const r = rows([t], db, NOW);
    const by = (l: string) => r.find((x) => x.label === l)!.cells[0];
    expect(isUnknownCell(by("Can sell"))).toBe(true);
    expect(by("Credit card")).toMatchObject({ lines: ["Unknown"], muted: true });
    expect(by("Free storage")).toMatchObject({ lines: ["? Not listed"], muted: true });
    expect(by("The catch")).toMatchObject({ lines: ["None listed"] });
  });
});
