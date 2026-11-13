import { describe, expect, it } from "vitest";
import { compactNumber, headline, isSuggested, labelState, scaleStep, sortForAisle, strings } from "./label";
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
const hosting: Aisle = {
  id: "hosting",
  group: "Build",
  name: "Hosting",
  metric: "requests_per_day",
  unit: "a day",
  label: "requests",
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

describe("labelState", () => {
  it("is unchecked with no check date", () => {
    expect(labelState(make({}), NOW)).toBe("unchecked");
  });
  it("is checked within 90 days", () => {
    expect(labelState(make({ verified_at: "2026-08-15" }), NOW)).toBe("checked");
  });
  it("is overdue past 90 days", () => {
    expect(labelState(make({ verified_at: "2026-07-24" }), NOW)).toBe("overdue");
  });
  it("puts imported first, then review, then vendor changed", () => {
    expect(labelState(make({ source: "imported", review_pending: true }), NOW)).toBe("imported");
    expect(labelState(make({ review_pending: true, vendor_changed_at: "2026-11-12" }), NOW)).toBe("review");
    expect(labelState(make({ vendor_changed_at: "2026-11-12", verified_at: "2026-11-10" }), NOW)).toBe(
      "vendor-changed",
    );
  });
});

describe("isSuggested", () => {
  it("needs the flag and a fresh check", () => {
    expect(isSuggested(make({ suggested: true, verified_at: "2026-11-10" }), NOW)).toBe(true);
    expect(isSuggested(make({ suggested: true, verified_at: "2026-07-01" }), NOW)).toBe(false);
    expect(isSuggested(make({ suggested: true }), NOW)).toBe(false);
    expect(isSuggested(make({ verified_at: "2026-11-10" }), NOW)).toBe(false);
  });
});

describe("scaleStep", () => {
  it("is ceil(value / max * 5), clamped to 1..5", () => {
    expect(scaleStep(make({ metric: 0.5 }), 5)).toMatchObject({ kind: "step", step: 1, word: "Small" });
    expect(scaleStep(make({ metric: 2 }), 5)).toMatchObject({ step: 2, word: "Fair" });
    expect(scaleStep(make({ metric: 3 }), 5)).toMatchObject({ step: 3, word: "Medium" });
    expect(scaleStep(make({ metric: 4 }), 5)).toMatchObject({ step: 4, word: "Big" });
    expect(scaleStep(make({ metric: 5 }), 5)).toMatchObject({ step: 5, word: "Biggest" });
    expect(scaleStep(make({ metric: 0.001 }), 5)).toMatchObject({ step: 1 });
  });
  it("says Not listed for an unknown value", () => {
    expect(scaleStep(make({ metric: null }), 5)).toEqual({ kind: "unknown", word: "Not listed" });
  });
  it("says Your own disk for no limit", () => {
    expect(scaleStep(make({ metric: null, metric_note: "No limit. Your own disk" }), 5)).toEqual({
      kind: "unlimited",
      word: "Your own disk",
    });
  });
});

describe("headline", () => {
  it("puts short units inline", () => {
    expect(headline(make({ metric: 0.5 }), db)).toEqual({ big: "0.5 GB", sub: null, known: true });
  });
  it("puts long units underneath", () => {
    expect(headline(make({ metric: 100000 }), hosting)).toEqual({ big: "100k", sub: "requests a day", known: true });
  });
  it("keeps a size unit with the number when the unit has more words", () => {
    const transfer: Aisle = { ...hosting, metric: "bandwidth_gb_month", unit: "GB a month", label: "transfer" };
    expect(headline(make({ metric: 100 }), transfer)).toEqual({ big: "100 GB", sub: "transfer a month", known: true });
  });
  it("does not repeat a word the label already says", () => {
    const users: Aisle = { ...hosting, metric: "monthly_users", unit: "users a month", label: "monthly users" };
    expect(headline(make({ metric: 50000 }), users)).toEqual({ big: "50k", sub: "monthly users", known: true });
  });
  it("shows ? for unknown and imported", () => {
    expect(headline(make({ metric: null }), db)).toMatchObject({ big: "?", sub: "Not listed", known: false });
    expect(headline(make({ source: "imported", metric: null }), db)).toMatchObject({ big: "?", known: false });
  });
  it("shows No limit", () => {
    expect(headline(make({ metric: null, metric_note: "No limit. Your own disk" }), db).big).toBe("No limit");
  });
});

describe("compactNumber", () => {
  it("formats", () => {
    expect(compactNumber(0.5)).toBe("0.5");
    expect(compactNumber(3000)).toBe("3,000");
    expect(compactNumber(100000)).toBe("100k");
    expect(compactNumber(1_500_000)).toBe("1.5M");
  });
});

describe("strings", () => {
  it("writes each strip", () => {
    expect(strings(make({ verified_at: "2026-11-10", verified_by: "Karlo" }), NOW).text).toBe(
      "Checked 3 days ago by Karlo",
    );
    expect(strings(make({ verified_at: "2026-11-13", verified_by: "Karlo" }), NOW).text).toBe("Checked today by Karlo");
    expect(strings(make({ verified_at: "2026-07-24" }), NOW)).toMatchObject({
      text: "Checked 24 Jul. Due for a recheck",
      link: "Recheck it",
    });
    expect(strings(make({}), NOW)).toMatchObject({ text: "Not checked yet", link: "Check it" });
    expect(strings(make({ review_pending: true }), NOW).text).toBe("A change is waiting for review");
    expect(strings(make({ name: "Neon", vendor_changed_at: "2026-11-12" }), NOW).text).toBe(
      "Neon changed its pricing page on 12 Nov",
    );
    expect(strings(make({ source: "imported", imported_from: "free-for-dev" }), NOW).text).toBe(
      "From free-for-dev. No numbers yet",
    );
  });
});

describe("sortForAisle", () => {
  it("orders Suggested, checked, rest; each by metric", () => {
    const a = make({ id: "a", name: "A", metric: 9 });
    const b = make({ id: "b", name: "B", metric: 1, verified_at: "2026-11-01" });
    const c = make({ id: "c", name: "C", metric: 0.5, verified_at: "2026-11-01", suggested: true });
    const d = make({ id: "d", name: "D", metric: 5, verified_at: "2026-11-01" });
    const e = make({ id: "e", name: "E", metric: null });
    expect(sortForAisle([a, b, c, d, e], NOW).map((t) => t.id)).toEqual(["c", "d", "b", "a", "e"]);
  });
});
