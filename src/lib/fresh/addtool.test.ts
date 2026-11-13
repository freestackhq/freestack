import { describe, expect, it } from "vitest";
import { findListed, parseFigure, readDraft, sameSite } from "./addtool";
import type { Aisle, Tool } from "./types";

const db: Aisle = { id: "databases", group: "Build", name: "Databases", metric: "storage_gb", unit: "GB", label: "free storage" };
const hosting: Aisle = { id: "hosting", group: "Build", name: "Hosting", metric: "requests_per_day", unit: "a day", label: "requests" };
const programs: Aisle = { id: "student-programs", group: "Claim Once", name: "Student programs", metric: "duration", unit: "", label: "how long it lasts" };
const AISLES = [db, hosting, programs];

function make(over: Partial<Tool>): Tool {
  return {
    id: "x", name: "X", kind: "", url: "https://x.dev", aisle: "databases", metric: 1, limits: [], who: ["anyone"],
    region: null, sell: "yes", card: "no", catches: [], use_if: [], skip_if: [], pricing_url: "", verified_at: null,
    verified_by: null, source: "catalog", ...over,
  };
}
const TOOLS = [
  make({ id: "neon", name: "Neon", url: "https://neon.tech" }),
  make({ id: "supabase", name: "Supabase", url: "https://supabase.com" }),
  make({ id: "xata-lite", name: "Xata Lite", url: "https://xata.io", source: "imported" }),
];

describe("parseFigure", () => {
  it("reads storage in the aisle's unit", () => {
    expect(parseFigure("0.5 GB", db)).toMatchObject({ kind: "number", value: 0.5, display: "0.5 GB" });
    expect(parseFigure("512 MB", db)).toMatchObject({ kind: "number", value: 0.5, display: "0.5 GB" });
    expect(parseFigure("2 TB", db)).toMatchObject({ kind: "number", value: 2048 });
    expect(parseFigure("5", db)).toMatchObject({ kind: "number", value: 5, display: "5 GB" });
  });

  it("reads counts with commas and k or M", () => {
    expect(parseFigure("100,000 requests a day", hosting)).toMatchObject({ kind: "number", value: 100000, display: "100k requests a day" });
    expect(parseFigure("100k", hosting)).toMatchObject({ value: 100000 });
    expect(parseFigure("1.5M", hosting)).toMatchObject({ value: 1500000 });
  });

  it("keeps a per-something note", () => {
    expect(parseFigure("0.5 GB per project", db)).toMatchObject({ kind: "number", value: 0.5, note: "per project" });
  });

  it("knows Not listed and No limit", () => {
    expect(parseFigure("Not listed", db)).toEqual({ kind: "none", display: "?" });
    expect(parseFigure("no limit", db)).toEqual({ kind: "unlimited", display: "No limit" });
  });

  it("rejects words that are not a number", () => {
    expect(parseFigure("lots", db)).toEqual({ kind: "invalid" });
    expect(parseFigure("about 5 GB", db)).toEqual({ kind: "invalid" });
    expect(parseFigure("5 parsecs", db)).toEqual({ kind: "invalid" });
    expect(parseFigure("   ", db)).toEqual({ kind: "empty" });
  });

  it("takes any wording for how long a program lasts", () => {
    expect(parseFigure("2 years", programs)).toEqual({ kind: "text", display: "2 years" });
  });
});

describe("findListed", () => {
  it("matches by name, ignoring case and spacing", () => {
    expect(findListed(TOOLS, { name: " neon " })?.id).toBe("neon");
    expect(findListed(TOOLS, { name: "SupaBase" })?.id).toBe("supabase");
  });

  it("matches by website", () => {
    expect(findListed(TOOLS, { url: "https://www.neon.tech/" })?.id).toBe("neon");
    expect(findListed(TOOLS, { url: "neon.tech" })?.id).toBe("neon");
  });

  it("ignores imported entries: writing their label is the point", () => {
    expect(findListed(TOOLS, { name: "Xata Lite", url: "https://xata.io" })).toBeUndefined();
  });

  it("finds nothing for a new tool", () => {
    expect(findListed(TOOLS, { name: "Koyeb", url: "https://koyeb.com" })).toBeUndefined();
    expect(findListed(TOOLS, {})).toBeUndefined();
  });
});

describe("sameSite", () => {
  it("compares host and path", () => {
    expect(sameSite("https://a.dev/x/", "http://www.a.dev/x")).toBe(true);
    expect(sameSite("https://a.dev/x", "https://a.dev/y")).toBe(false);
    expect(sameSite("", "https://a.dev")).toBe(false);
  });
});

function form(over: Record<string, string | string[]> = {}): FormData {
  const base: Record<string, string | string[]> = {
    name: "Koyeb",
    url: "https://koyeb.com",
    kind: "Containers",
    aisle: "databases",
    figure: "512 MB",
    pricing_url: "https://koyeb.com/pricing",
    limits: "1 web service\n\n512 MB memory ",
    who: ["anyone"],
    region: "",
    sell: "unknown",
    card: "no",
    catch: ["Sleeps after 1 hour idle", ""],
    use_if: ["", ""],
    skip_if: ["You need logins", ""],
    use_instead: ["Supabase", ""],
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...base, ...over })) for (const x of [v].flat()) fd.append(k, x);
  return fd;
}

describe("readDraft", () => {
  it("turns the form into a pending tool", () => {
    const r = readDraft(form(), AISLES, TOOLS);
    expect(r.errors).toEqual({});
    expect(r.draft!.tool).toMatchObject({
      id: "koyeb",
      name: "Koyeb",
      aisle: "databases",
      metric: 0.5,
      limits: ["1 web service", "512 MB memory"],
      who: ["anyone"],
      sell: "unknown",
      card: "no",
      catches: ["Sleeps after 1 hour idle"],
      use_if: [],
      skip_if: [{ reason: "You need logins", use: "supabase" }],
      source: "submitted",
      review_pending: true,
      verified_at: null,
    });
    expect(r.draft!.figure).toBe("512 MB");
  });

  it("accepts an aisle by name when the script did not run", () => {
    const r = readDraft(form({ aisle: "", aisle_text: "hosting" }), AISLES, TOOLS);
    expect(r.draft!.tool.aisle).toBe("hosting");
  });

  it("Not listed keeps the number empty", () => {
    const r = readDraft(form({ figure: "Not listed" }), AISLES, TOOLS);
    expect(r.draft!.tool.metric).toBeNull();
    expect(r.draft!.tool.metric_note).toBe("Not listed");
  });

  it("names every missing or bad answer", () => {
    const r = readDraft(
      form({ name: "", url: "nope", aisle: "", figure: "lots", pricing_url: "", who: [] }),
      AISLES,
      TOOLS,
    );
    expect(Object.keys(r.errors).sort()).toEqual(["aisle", "figure", "name", "pricing_url", "url", "who"]);
    expect(r.draft).toBeNull();
  });

  it("stops a tool that is already listed", () => {
    const r = readDraft(form({ name: "Neon" }), AISLES, TOOLS);
    expect(r.errors.name).toMatch(/already on freestack/);
    expect(r.listed?.id).toBe("neon");
  });
});
