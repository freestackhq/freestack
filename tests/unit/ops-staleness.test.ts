import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { RECHECK_DAYS as LABEL_DAYS } from "../../src/lib/fresh/label";
import { RECHECK_DAYS, staleSuggested } from "../../scripts/ops/staleness-gate.mjs";
import { loadTools } from "../../scripts/ops/tools.mjs";

const FIX = new URL("../fixtures/ops/", import.meta.url).pathname;
const SCRIPT = new URL("../../scripts/ops/staleness-gate.mjs", import.meta.url).pathname;
const NOW = new Date("2026-11-13T00:00:00Z");

function gate(dataDir: string, day = "2026-11-13") {
  return spawnSync(process.execPath, [SCRIPT, "--today", day], {
    env: { ...process.env, FREESTACK_DATA: dataDir },
    encoding: "utf8",
  });
}

describe("staleSuggested", () => {
  it("uses the label's recheck window, not its own copy", () => {
    expect(RECHECK_DAYS).toBe(LABEL_DAYS);
  });

  it("lists suggested tools that were never checked or are past the window", () => {
    const stale = staleSuggested(loadTools(`${FIX}stale`), NOW);
    expect(stale).toEqual([
      { id: "never-checked", file: "tools/never-checked.yaml", verified_at: null, days: null },
      { id: "old-pick", file: "tools/old-pick.yaml", verified_at: "2026-01-15", days: 302 },
    ]);
  });

  it("ignores tools that are not suggested, however old", () => {
    expect(staleSuggested(loadTools(`${FIX}fresh`), NOW)).toEqual([]);
  });

  it("day 90 still passes, day 91 fails (same rule as the Overdue label)", () => {
    const tool = (verified_at: string) => ({
      id: "x",
      file: "tools/x.yaml",
      suggested: true,
      source: "catalog",
      verified_at,
    });
    expect(staleSuggested([tool("2026-08-15")], NOW)).toEqual([]); // 90 days
    expect(staleSuggested([tool("2026-08-14")], NOW).map((t) => t.days)).toEqual([91]);
  });
});

describe("staleness-gate CLI", () => {
  it("exits 1 and names every offender", () => {
    const r = gate(`${FIX}stale`);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("2 suggested tools need a recheck");
    expect(r.stderr).toContain("never-checked (tools/never-checked.yaml): never checked");
    expect(r.stderr).toContain("old-pick (tools/old-pick.yaml): checked 2026-01-15, 302 days ago");
    expect(r.stderr).not.toContain("fresh-pick");
    expect(r.stderr).not.toContain("old-not-suggested");
  });

  it("exits 0 when every suggested tool is fresh", () => {
    const r = gate(`${FIX}fresh`);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("1 suggested tools, all checked within 90 days");
  });

  it("the same fresh tool fails once it ages past the window", () => {
    expect(gate(`${FIX}fresh`, "2027-01-01").status).toBe(1);
  });
});
