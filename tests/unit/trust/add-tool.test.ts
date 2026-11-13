import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildTool, labelUrl, planAddTool, prBody } from "../../../scripts/trust/add-tool.mjs";
import { validate } from "../../../scripts/trust/schema.mjs";
import { ADD_TOOL, issueBody, parseIssueForm } from "../../../src/lib/trust/forms.mjs";

const fx = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const AISLES = fx("aisles.yaml");
const SCHEMA = JSON.parse(readFileSync("schema/tool.schema.json", "utf8"));
const none = () => null;
const plan = (body: string, readTool: (id: string) => string | null = none) =>
  planAddTool({ body, aislesText: AISLES, schema: SCHEMA, readTool });

describe("planAddTool", () => {
  it("builds the tool file from the form", () => {
    const p = plan(fx("add-tool.md"));
    expect(p.kind).toBe("add");
    if (p.kind !== "add") return;
    expect(p.yaml).toBe(
      [
        "id: fresh-base",
        "name: Fresh Base",
        "kind: Serverless SQLite",
        "url: https://freshbase.example",
        "aisle: databases",
        "metric: 0.5",
        "limits:",
        "  - 1 database",
        "  - 100 writes a second",
        "who: [anyone, student_any_id]",
        "region: null",
        "sell: unknown",
        "card: no",
        "catches:",
        "  - Deletes idle databases",
        "use_if: []",
        "skip_if:",
        "  - reason: You need logins",
        "    use: supabase",
        '  - reason: "You need: SQL Server, \\"really\\""',
        "pricing_url: https://freshbase.example/pricing",
        "verified_at: null",
        "verified_by: null",
        "source: submitted",
        "",
      ].join("\n"),
    );
    expect(validate(SCHEMA, p.tool)).toEqual([]);
  });

  it("unknowns stay unknown: no number means null with Not listed", () => {
    const p = plan(fx("add-tool-not-listed.md"));
    expect(p.kind).toBe("add");
    if (p.kind !== "add") return;
    expect(p.tool).toMatchObject({
      id: "mystery-db",
      kind: "",
      metric: null,
      metric_note: "Not listed",
      sell: "unknown",
      card: "unknown",
      limits: [],
      region: null,
      verified_at: null,
      source: "submitted",
    });
    expect(p.yaml).toContain("metric: null\nmetric_note: Not listed\n");
  });

  it("a tool already listed links to its label instead", () => {
    const p = plan(fx("add-tool.md"), (id) => (id === "fresh-base" ? "id: fresh-base\naisle: databases\n" : null));
    expect(p).toEqual({ kind: "listed", id: "fresh-base", aisle: "databases" });
    expect(labelUrl({ siteUrl: "https://shelf.example/", repo: "a/b", branch: "main", ...p })).toBe(
      "https://shelf.example/databases/fresh-base",
    );
    expect(labelUrl({ siteUrl: "", repo: "a/b", branch: "main", ...p })).toBe(
      "https://github.com/a/b/blob/main/data/tools/fresh-base.yaml",
    );
  });

  it("rejects a malformed form with every reason", () => {
    const form = parseIssueForm(fx("add-tool.md"), ADD_TOOL);
    const body = issueBody(ADD_TOOL, {
      ...form,
      aisle: "snacks",
      metric: "lots",
      who: "everyone",
      sell: "maybe",
      catches: "A catch far longer than forty characters, so the schema says no",
      pricing_url: "not a link",
    });
    const p = plan(body);
    expect(p.kind).toBe("reject");
    if (p.kind !== "reject") return;
    expect(p.reasons).toEqual([
      "There is no aisle `snacks`. Use one of: databases, hosting.",
      '"lots" is not a number. Write the number in the aisle\'s unit, or leave it empty.',
      "Who can claim it: `everyone` is not one of anyone, student_any_id, student_school_email, startup_proof.",
      "Can you sell with it: write yes, no or unknown.",
      "who needs at least 1.",
      "catches[0] should be 40 characters at most.",
      "pricing_url should be a link starting with https://.",
    ]);
  });

  it("the PR closes the issue", () => {
    const p = plan(fx("add-tool.md"));
    if (p.kind === "add") expect(prBody(p.tool, 9)).toMatch(/Closes #9$/);
  });
});

describe("buildTool", () => {
  it("makes the id from the name and keeps the bullet-free lines", () => {
    const form = parseIssueForm(fx("add-tool.md"), ADD_TOOL);
    const { tool } = buildTool({ ...form, id: "", name: "Fresh Base 2!", limits: "- one\n* two\n\n" }, [{ id: "databases", unit: "GB" }]);
    expect(tool.id).toBe("fresh-base-2");
    expect(tool.limits).toEqual(["one", "two"]);
  });
});

describe("validate", () => {
  it("names extra fields and wrong types", () => {
    expect(validate(SCHEMA, { id: "Bad Id", extra: 1 })).toEqual(
      expect.arrayContaining(["id has characters it can't have.", "extra is not a tool field.", "name is missing."]),
    );
    expect(validate({ type: ["string", "null"], format: "date" }, "2026-02-30x")).toEqual([
      "the tool should be a date like 2026-01-31.",
    ]);
  });
});
