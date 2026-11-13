import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  addReview,
  applyChange,
  hasReview,
  markChecked,
  parseMetric,
  planLabelCheck,
  prBody,
  rejectComment,
  removeReview,
} from "../../../scripts/trust/label-check.mjs";
import { readReviews } from "../../../scripts/trust/yaml.mjs";

const fx = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const NEON = fx("neon.yaml");
const AISLES = fx("aisles.yaml");
const readTool = (id: string) => (id === "neon" ? NEON : null);
const base = { author: "ada", today: "2026-11-13", readTool, aislesText: AISLES };

describe("planLabelCheck", () => {
  it("all still true: marks the tool checked, touching only those two lines", () => {
    const plan = planLabelCheck({ ...base, body: fx("label-check-all-true.md") });
    expect(plan.kind).toBe("verify");
    if (plan.kind !== "verify") return;
    expect(plan.tool).toBe("neon");
    const before = NEON.split("\n");
    const after = plan.toolText.split("\n");
    expect(after).toHaveLength(before.length);
    const diff = after.filter((l, i) => l !== before[i]);
    expect(diff).toEqual(['verified_at: "2026-11-13"', "verified_by: ada"]);
  });

  it("any changed: applies what it can read and leaves the rest to a person", () => {
    const plan = planLabelCheck({ ...base, body: fx("label-check-changed.md") });
    expect(plan.kind).toBe("review");
    if (plan.kind !== "review") return;
    expect(plan.applied.map((a) => a.field)).toEqual(["metric", "limits.1", "who", "card"]);
    expect(plan.manual.map((a) => a.field)).toEqual(["sell"]);
    const t = plan.toolText;
    expect(t).toContain("metric: 1          # storage_gb, the Databases aisle metric\n");
    expect(t).toContain("  - Sleeps after 10 minutes idle   # since 2024\n");
    expect(t).toContain("  - 5 GB data sent out a month\n");
    expect(t).toContain("who: [anyone, startup_proof]\n");
    expect(t).toContain("card: no\n");
    expect(t).toContain('verified_at: "2026-11-13"\nverified_by: ada\n');
    // Comments and untouched lines survive.
    expect(t).toContain("  - { reason: Your users are all over the world, use: turso }\n");

    const body = prBody(plan, 42);
    expect(body).toContain("Closes #42");
    expect(body).toContain("Set by hand before merging (not applied automatically):\n- `sell`: Only on paid plans");
    expect(t).toContain("\nsell: yes\n");
  });

  it("rejects an unknown tool", () => {
    const plan = planLabelCheck({ ...base, body: fx("label-check-unknown-tool.md") });
    expect(plan).toEqual({
      kind: "reject",
      reasons: ["There is no tool with the id `fauna` (looked for data/tools/fauna.yaml)."],
    });
  });

  it("rejects a malformed form (CRLF body as GitHub stores edits)", () => {
    const plan = planLabelCheck({ ...base, body: fx("label-check-malformed.md") });
    expect(plan.kind).toBe("reject");
    if (plan.kind !== "reject") return;
    expect(plan.reasons).toEqual([
      '"metric" says Changed but not what it says now.',
      'Could not read this line: "- sell | x | maybe"',
    ]);
    expect(rejectComment(plan.reasons)).toContain("Edit the issue to fix it");
  });

  it("rejects an empty form and an id that is not an id", () => {
    expect(planLabelCheck({ ...base, body: "" })).toEqual({
      kind: "reject",
      reasons: ["The tool id is empty.", "No line is answered."],
    });
    const bad = planLabelCheck({ ...base, body: "### Tool id\n\n../../etc\n\n### Answers\n\n- sell | S: Yes | Still true" });
    expect(bad.kind).toBe("reject");
  });
});

describe("parseMetric", () => {
  it("reads figures the way Add a tool does", () => {
    expect(parseMetric("1 GB", "GB")).toEqual({ metric: 1, note: undefined });
    expect(parseMetric("512 MB", "GB")).toEqual({ metric: 0.5, note: undefined });
    expect(parseMetric("3 GB per project", "GB")).toEqual({ metric: 3, note: "per project" });
    expect(parseMetric("200k requests a day", "a day")).toEqual({ metric: 200000, note: undefined });
    expect(parseMetric("Not listed", "GB")).toEqual({ metric: null, note: "Not listed" });
    expect(parseMetric("No limit", "GB")).toEqual({ metric: null, note: "No limit" });
  });

  it("refuses to guess", () => {
    expect(parseMetric("lots", "GB")).toBeNull();
    expect(parseMetric("1 GB-ish of rows", "GB")).toBeNull();
  });
});

describe("applyChange", () => {
  const ch = (field: string, now: string) => ({ field, verdict: "changed", now, line: "" });

  it("sets a metric note and drops it when the new figure has none", () => {
    const noted = applyChange(NEON, ch("metric", "Not listed"), "GB")!;
    expect(noted).toContain("metric: null          # storage_gb");
    expect(noted).toContain("\nmetric_note: Not listed\nlimits:");
    expect(applyChange(noted, ch("metric", "2 GB"), "GB")).not.toContain("metric_note");
  });

  it("sell and card take the words the check page shows", () => {
    expect(applyChange(NEON, ch("sell", "No"), "GB")).toContain("\nsell: no\n");
    expect(applyChange(NEON, ch("card", "Needed"), "GB")).toContain("\ncard: yes\n");
    expect(applyChange(NEON, ch("card", "maybe"), "GB")).toBeNull();
  });

  it("quotes values YAML would misread", () => {
    expect(applyChange(NEON, ch("catches.0", "No: backups"), "GB")).toContain('  - "No: backups"\n');
    expect(applyChange(NEON, ch("catches.0", "yes"), "GB")).toContain('  - "yes"\n');
  });

  it("leaves lines it can't place to a person", () => {
    expect(applyChange(NEON, ch("limits.5", "x"), "GB")).toBeNull();
    expect(applyChange(NEON, ch("who", "Everyone in Europe"), "GB")).toBeNull();
    expect(applyChange(NEON, ch("program.lasts", "1 yr"), "GB")).toBeNull();
  });
});

describe("markChecked", () => {
  it("adds the fields after pricing_url when a file lacks them", () => {
    const text = "id: x\npricing_url: https://x.dev\nsource: catalog\n";
    expect(markChecked(text, "2026-11-13", "123")).toBe(
      'id: x\npricing_url: https://x.dev\nverified_at: "2026-11-13"\nverified_by: "123"\nsource: catalog\n',
    );
  });
});

describe("reviews.yaml", () => {
  it("adds an entry once, creating the file, and removes it by issue", () => {
    const one = addReview("", { tool: "neon", issue: 42, opened: "2026-11-13" });
    expect(one).toMatch(/^# Open "Changed" reports/);
    expect(one).toContain('- { tool: neon, issue: 42, opened: "2026-11-13" }\n');
    expect(addReview(one, { tool: "neon", issue: 42, opened: "2026-11-14" })).toBe(one);
    const two = addReview(one, { tool: "d1", issue: 7, opened: "2026-11-14" });
    expect(readReviews(two)).toEqual([
      { tool: "neon", issue: 42, opened: "2026-11-13" },
      { tool: "d1", issue: 7, opened: "2026-11-14" },
    ]);
    expect(hasReview(two, 7)).toBe(true);
    const back = removeReview(two, 42);
    expect(readReviews(back)).toEqual([{ tool: "d1", issue: 7, opened: "2026-11-14" }]);
    expect(removeReview(back, 7)).toMatch(/\n\[\]\n$/);
  });

  it("reads entries a maintainer wrote by hand in block style", () => {
    const text = "- tool: neon\n  issue: 3\n  opened: 2026-01-02 # by hand\n";
    expect(readReviews(text)).toEqual([{ tool: "neon", issue: 3, opened: "2026-01-02" }]);
  });
});
