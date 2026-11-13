import { describe, expect, it } from "vitest";
import {
  MAX_COMPARE,
  MUST,
  activeCount,
  compareHref,
  countLine,
  crossAisle,
  describeFilters,
  dropOffers,
  matches,
  noMatchTitle,
  one,
  parseState,
  toSearch,
  trayHint,
  type FilterItem,
} from "./aisle-page";

const item = (over: Partial<FilterItem> = {}): FilterItem => ({
  type: "postgres",
  sell: "yes",
  card: "no",
  who: ["anyone"],
  ...over,
});

describe("parseState / toSearch", () => {
  const types = ["postgres", "sqlite"];
  const ids = ["neon", "turso", "d1", "convex", "mongo", "vercel-hobby"];

  it("reads type, must and compare from the URL", () => {
    const s = parseState("?type=sqlite&must=sell,no-card&compare=neon,turso", types, ids);
    expect(s).toEqual({ type: "sqlite", must: ["sell", "no-card"], compare: ["neon", "turso"] });
  });

  it("drops unknown values instead of guessing", () => {
    const s = parseState("?type=graph&must=sell,cheap&compare=neon,nope,neon", types, ids);
    expect(s).toEqual({ type: null, must: ["sell"], compare: ["neon"] });
  });

  it("caps compare at 4", () => {
    const s = parseState("?compare=neon,turso,d1,convex,mongo", types, ids);
    expect(s.compare).toHaveLength(MAX_COMPARE);
  });

  it("writes a stable query and nothing when empty", () => {
    expect(toSearch({ type: null, must: [], compare: [] })).toBe("");
    expect(toSearch({ type: "postgres", must: ["no-card", "sell"], compare: ["neon", "turso"] })).toBe(
      "?type=postgres&must=sell,no-card&compare=neon,turso",
    );
  });
});

describe("matches", () => {
  it("type filter", () => {
    expect(matches(item(), { type: "postgres", must: [] })).toBe(true);
    expect(matches(item({ type: "sqlite" }), { type: "postgres", must: [] })).toBe(false);
  });

  it("can sell needs a yes, unknown does not count", () => {
    expect(matches(item({ sell: "yes" }), { type: null, must: ["sell"] })).toBe(true);
    expect(matches(item({ sell: "unknown" }), { type: null, must: ["sell"] })).toBe(false);
  });

  it("no card needs a confirmed no", () => {
    expect(matches(item({ card: "no" }), { type: null, must: ["no-card"] })).toBe(true);
    expect(matches(item({ card: "unknown" }), { type: null, must: ["no-card"] })).toBe(false);
    expect(matches(item({ card: "yes" }), { type: null, must: ["no-card"] })).toBe(false);
  });

  it("no school email: anything but school-email-only", () => {
    expect(matches(item({ who: ["student_school_email"] }), { type: null, must: ["no-school-email"] })).toBe(false);
    expect(matches(item({ who: ["student_school_email", "student_any_id"] }), { type: null, must: ["no-school-email"] })).toBe(true);
  });
});

describe("no matches", () => {
  const items = [item({ card: "unknown" }), item({ type: "sqlite" }), item({ type: "sqlite" }), item({ type: "sqlite", sell: "no" })];

  it("offers the drop that gives the most matches", () => {
    const f = { type: "postgres", must: ["no-card", "sell"] };
    expect(items.filter((i) => matches(i, f))).toHaveLength(0);
    const offers = dropOffers(items, f, { postgres: "Postgres" });
    expect(offers[0]).toEqual({ key: "type", label: "Postgres", count: 2 });
    expect(offers.find((o) => o.key === "no-card")).toEqual({ key: "no-card", label: "No card", count: 1 });
  });

  it("describes filters in a sentence", () => {
    expect(describeFilters({ type: "postgres", must: ["sell", "no-card"] }, { postgres: "Postgres" })).toBe(
      "Postgres, can sell and no credit card.",
    );
    expect(describeFilters({ type: null, must: ["no-card"] }, {})).toBe("No credit card.");
  });

  it("titles", () => {
    expect(noMatchTitle("databases", 3)).toBe("No database fits all 3 filters");
    expect(noMatchTitle("storage services", 1)).toBe("No storage service fits this filter");
    expect(noMatchTitle("caches and queues", 2)).toBe("Nothing fits all 2 filters");
  });

  it("counts active filters", () => {
    expect(activeCount({ type: null, must: [] })).toBe(0);
    expect(activeCount({ type: "x", must: ["sell"] })).toBe(2);
  });
});

describe("copy", () => {
  it("singular nouns", () => {
    expect(one("databases")).toBe("database");
    expect(one("inference APIs")).toBe("inference API");
    expect(one("caches and queues")).toBe("tool");
  });

  it("count line", () => {
    expect(countLine(8, "databases", "free storage")).toBe("8 free databases, by free storage.");
    expect(countLine(1, "inference APIs", "requests")).toBe("1 free inference API, by requests.");
    expect(countLine(0, "hosts", "requests")).toBe("No labels here yet.");
  });

  it("tray hint", () => {
    expect(trayHint(1, false)).toBe("Add one more to compare");
    expect(trayHint(2, false)).toBe("");
    expect(trayHint(4, true)).toBe("You can compare 4 at a time. Remove one to add another.");
  });

  it("compare link", () => {
    expect(compareHref(["neon", "turso"])).toBe("/compare?ids=neon,turso");
  });

  it("filter labels exist for every must", () => {
    for (const m of MUST) expect(m.chip && m.sheet && m.short && m.phrase).toBeTruthy();
  });
});

describe("crossAisle", () => {
  const index = {
    neon: { name: "Neon", aisle: "databases" },
    turso: { name: "Turso", aisle: "databases" },
    "vercel-hobby": { name: "Vercel Hobby", aisle: "hosting" },
    koyeb: { name: "Koyeb", aisle: "hosting" },
    clerk: { name: "Clerk", aisle: "auth" },
  };

  it("null when every pick is in this aisle", () => {
    expect(crossAisle(["neon", "turso"], "databases", index)).toBeNull();
  });

  it("names the foreign picks from the first other aisle", () => {
    expect(crossAisle(["neon", "vercel-hobby", "turso", "koyeb", "clerk"], "databases", index)).toEqual({
      aisle: "hosting",
      names: ["Vercel Hobby", "Koyeb"],
      ids: ["vercel-hobby", "koyeb"],
      own: ["neon", "turso"],
    });
  });
});
