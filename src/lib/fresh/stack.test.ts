import { describe, expect, it } from "vitest";
import {
  cardNote,
  headlineText,
  limitsLine,
  otherLimits,
  matchTool,
  parseStack,
  rowState,
  splitTools,
  stackMarkdown,
  stackPrompt,
  stackSearch,
  toStackTool,
} from "./stack";
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

describe("limitsLine", () => {
  it("leads with the headline figure in the aisle's unit", () => {
    const t = make({
      metric: 0.5,
      limits: ["5 GB transfer a month", "Sleeps after 5 minutes idle"],
      catches: ["Sleeps after 5 minutes idle"],
    });
    expect(limitsLine(t, db)).toBe("0.5 GB free storage, 5 GB transfer a month");
    expect(limitsLine(make({ aisle: "hosting", metric: 100000, limits: ["10 ms CPU per request"] }), hosting)).toBe(
      "100k requests a day, 10 ms CPU per request",
    );
  });
  it("says unknown instead of guessing", () => {
    expect(limitsLine(make({ metric: null, metric_note: "Not listed" }), hosting)).toBe("Requests a day: unknown");
    const transfer = { ...hosting, unit: "GB a month", label: "transfer" };
    expect(limitsLine(make({ metric: 100 }), transfer)).toBe("100 GB transfer a month");
    expect(limitsLine(make({ metric: null, metric_note: "Not listed" }), transfer)).toBe("Transfer a month: unknown");
    expect(limitsLine(make({ metric: null }), db)).toBe("Free storage: unknown");
  });
  it("uses the vendor's own wording when the metric does not apply", () => {
    expect(limitsLine(make({ metric: null, metric_note: "750 hours a month" }), hosting)).toBe("750 hours a month");
    // The note is often also the first limit; say it once.
    expect(
      limitsLine(
        make({ metric: null, metric_note: "100k requests a day", limits: ["100k requests a day", "Static unlimited"] }),
        hosting,
      ),
    ).toBe("100k requests a day, Static unlimited");
    expect(limitsLine(make({ metric: null, metric_note: "No limit. Your own disk" }), db)).toBe(
      "No limit. Your own disk",
    );
  });
});

describe("headline and fine print", () => {
  const users = { ...hosting, id: "auth", metric: "monthly_users", unit: "users a month", label: "monthly users" };
  it("headlineText is the first item of the limits line", () => {
    const t = make({ metric: 0.5, limits: ["5 GB transfer a month"] });
    expect(headlineText(t, db)).toBe("0.5 GB free storage");
  });
  it("drops a line that restates a scale headline in other words", () => {
    const clerk = make({ aisle: "auth", metric: 50000, limits: ["50k MRU free", "Then paid"] });
    expect(otherLimits(clerk, users)).toEqual(["Then paid"]);
  });
  it("keeps a different limit that shares a plain figure", () => {
    const t = make({ metric: 5, limits: ["5 GB transfer a month"] });
    expect(otherLimits(t, db)).toEqual(["5 GB transfer a month"]);
  });
});

describe("rowState", () => {
  it("is null for a checked label and describes the others", () => {
    expect(rowState(make({ verified_at: "2026-11-10", verified_by: "Karlo" }), NOW)).toBeNull();
    expect(rowState(make({ verified_at: "2026-07-24" }), NOW)).toEqual({
      state: "overdue",
      text: "Checked 24 Jul. Due for a recheck",
      link: "Recheck it",
    });
    expect(rowState(make({}), NOW)?.state).toBe("unchecked");
  });
  it("a preset tool goes overdue once 90 days pass", () => {
    const t = make({ verified_at: "2026-11-10", verified_by: "Karlo" });
    expect(rowState(t, new Date("2027-03-01T00:00:00Z"))?.state).toBe("overdue");
  });
});

describe("toStackTool", () => {
  it("keeps what the rules need plus the row text", () => {
    const s = toStackTool(
      make({ id: "neon", name: "Neon", metric: 0.5, catches: ["Sleeps"] }),
      db,
      "/databases/neon",
      NOW,
      "Database",
    );
    expect(s).toMatchObject({
      id: "neon",
      name: "Neon",
      href: "/databases/neon",
      catch: "Sleeps",
      part: "Database",
      state: "unchecked",
    });
  });
});

describe("URL", () => {
  const parts = [{ key: "hosting" }, { key: "database" }, { key: "auth" }];
  const ok: Record<string, string[]> = {
    hosting: ["cf-workers", "vercel-hobby"],
    database: ["neon", "d1"],
    auth: ["clerk"],
  };
  const opts = {
    parts,
    canFill: (k: string, id: string) => ok[k]?.includes(id) ?? false,
    situations: ["school", "student", "indie", "startup"] as const as unknown as (
      "school" | "student" | "indie" | "startup"
    )[],
    fallback: "student" as const,
  };

  it("reads the situation and picks", () => {
    expect(parseStack("?as=indie&hosting=cf-workers&database=neon", opts)).toEqual({
      situation: "indie",
      picks: { hosting: "cf-workers", database: "neon" },
      dropped: [],
    });
  });
  it("falls back and drops what it can't place", () => {
    expect(parseStack("?as=wizard&hosting=fauna&auth=clerk", opts)).toEqual({
      situation: "student",
      picks: { auth: "clerk" },
      dropped: ["fauna"],
    });
    expect(parseStack("", opts)).toEqual({ situation: "student", picks: {}, dropped: [] });
  });
  it("writes parts in a fixed order and round-trips", () => {
    const s = stackSearch("indie", { database: "d1", hosting: "cf-workers" }, parts);
    expect(s).toBe("?as=indie&hosting=cf-workers&database=d1");
    expect(parseStack(s, opts).picks).toEqual({ hosting: "cf-workers", database: "d1" });
    expect(stackSearch("student", {}, parts)).toBe("?as=student");
  });
});

describe("Check my stack input", () => {
  const tools = [
    { id: "vercel-hobby", name: "Vercel Hobby" },
    { id: "supabase", name: "Supabase" },
    { id: "cf-workers", name: "Cloudflare Workers & Pages" },
    { id: "d1", name: "Cloudflare D1" },
  ];
  it("splits pasted lists", () => {
    expect(splitTools("Vercel, Supabase and Clerk")).toEqual(["Vercel", "Supabase", "Clerk"]);
    expect(splitTools("neon\nturso; d1 + r2")).toEqual(["neon", "turso", "d1", "r2"]);
    expect(splitTools("  ,, ")).toEqual([]);
  });
  it("matches by id, name or a unique first word", () => {
    expect(matchTool("supabase", tools)?.id).toBe("supabase");
    expect(matchTool("Vercel Hobby", tools)?.id).toBe("vercel-hobby");
    expect(matchTool("vercel", tools)?.id).toBe("vercel-hobby");
    expect(matchTool("d1", tools)?.id).toBe("d1");
  });
  it("returns null for unknown or ambiguous names", () => {
    expect(matchTool("Fauna", tools)).toBeNull();
    expect(matchTool("Cloudflare", tools)).toBeNull();
    expect(matchTool("", tools)).toBeNull();
  });
});

describe("totals and copy text", () => {
  it("card note", () => {
    expect(cardNote([])).toBe("");
    expect(cardNote([{ card: "no" }])).toBe("No card needed for any part");
    expect(cardNote([{ card: "yes" }, { card: "unknown" }, { card: "unknown" }])).toBe(
      "1 part needs a credit card at signup, card unknown for 2 parts",
    );
  });

  const data = {
    situation: "Indie builder",
    url: "https://example.test/build?as=indie&hosting=cf-workers&database=neon",
    rows: [
      { job: "Hosting", name: "Cloudflare Workers & Pages", limits: "100k requests a day", catch: null },
      { job: "Database", name: "Neon", limits: "0.5 GB free storage", catch: "Sleeps after 5 minutes idle" },
    ],
  };

  it("markdown", () => {
    expect(stackMarkdown(data)).toBe(
      [
        "## My free stack (from freestack)",
        "For: Indie builder",
        "",
        "- Hosting: Cloudflare Workers & Pages",
        "  100k requests a day",
        "- Database: Neon",
        "  0.5 GB free storage. Catch: Sleeps after 5 minutes idle",
        "",
        "Total per month: $0.00",
        data.url,
      ].join("\n"),
    );
  });

  it("copied text says which parts nobody has checked", () => {
    const mixed = {
      ...data,
      rows: [
        { ...data.rows[0], checked: true },
        { ...data.rows[1], checked: false },
      ],
    };
    const md = stackMarkdown(mixed);
    expect(md).toContain("- Hosting: Cloudflare Workers & Pages\n");
    expect(md).toContain("- Database: Neon (not checked yet)");
    expect(md).toContain("Confirm on each vendor's page before you launch.");
    expect(stackPrompt(mixed)).toContain("- Database: Neon (0.5 GB free storage) (not checked yet)");
    // Rows without a known state (older callers) stay as they were.
    expect(stackMarkdown(data)).not.toContain("not checked");
  });

  it("agent prompt names every part and every catch", () => {
    const p = stackPrompt(data);
    expect(p).toContain("- Hosting: Cloudflare Workers & Pages (100k requests a day)");
    expect(p).toContain("- Neon: Sleeps after 5 minutes idle");
    expect(p).toContain(data.url);
    expect(stackPrompt({ ...data, rows: [data.rows[0]] })).not.toContain("Warn me");
  });
});
