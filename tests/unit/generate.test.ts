/**
 * scripts/generate.mjs against copies of the fixture data: label state
 * inputs, state-file merging, imported entries, scale, determinism, and the
 * loud failures.
 */
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { labelState } from "../../src/lib/fresh/label";
import type { Tool } from "../../src/lib/fresh/types";

const root = process.cwd();
const dirs: string[] = [];

function copyFixtures(): string {
  const dir = mkdtempSync(join(tmpdir(), "freestack-gen-"));
  dirs.push(dir);
  cpSync(join(root, "tests/fixtures/data"), dir, { recursive: true });
  rmSync(join(dir, ".generated"), { recursive: true, force: true });
  return dir;
}

function run(dir: string, env: Record<string, string> = {}) {
  return spawnSync(process.execPath, ["scripts/generate.mjs"], {
    cwd: root,
    env: { ...process.env, FREESTACK_DATA: dir, ...env },
    encoding: "utf8",
  });
}

function generate(dir: string) {
  const r = run(dir);
  expect(r.status, r.stderr).toBe(0);
  return JSON.parse(readFileSync(join(dir, ".generated/catalog.json"), "utf8"));
}

afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

describe("generator", () => {
  const dir = copyFixtures();
  const snap = generate(dir);
  const t = (id: string): Tool => snap.tools.find((x: Tool) => x.id === id);
  const now = new Date();

  it("resolves fixture dates and covers every label state", () => {
    expect(labelState(t("neon"), now)).toBe("checked");
    expect(labelState(t("supabase"), now)).toBe("overdue");
    expect(labelState(t("convex"), now)).toBe("unchecked");
    expect(labelState(t("d1"), now)).toBe("review");
    expect(labelState(t("turso"), now)).toBe("vendor-changed");
    expect(labelState(t("xata-lite"), now)).toBe("imported");
    expect(t("neon").verified_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("merges reviews.yaml with the issue number", () => {
    expect(t("d1").review_pending).toBe(true);
    expect(t("d1").review_issue).toBe(1);
  });

  it("turns imported entries into unlabeled tools", () => {
    const x = t("xata-lite");
    expect(x.source).toBe("imported");
    expect(x.imported_from).toBe("free-for-dev");
    expect(x.metric).toBeNull();
    expect(x.limits).toEqual([]);
    expect(snap.lists[0]).toMatchObject({ id: "free-for-dev", count: 1 });
  });

  it("computes the 5-step scale, ? and No limit", () => {
    expect(t("turso").scale).toEqual({ kind: "step", step: 5, word: "Biggest" });
    expect(t("neon").scale).toEqual({ kind: "step", step: 1, word: "Small" });
    expect(t("appwrite").scale).toEqual({ kind: "unknown", word: "Not listed" });
    expect(t("pocketbase").scale).toMatchObject({ kind: "unlimited" });
    expect(snap.aisles.find((a: { id: string }) => a.id === "databases").max).toBe(5);
  });

  it("is deterministic", () => {
    const first = readFileSync(join(dir, ".generated/catalog.json"), "utf8");
    generate(dir);
    expect(readFileSync(join(dir, ".generated/catalog.json"), "utf8")).toBe(first);
  });

  it("a recheck after the vendor change clears vendor changed", () => {
    const d = copyFixtures();
    const file = join(d, "tools/turso.yaml");
    writeFileSync(file, readFileSync(file, "utf8").replace(/verified_days_ago: \d+/, "verified_days_ago: 0"));
    const s = generate(d);
    const turso = s.tools.find((x: Tool) => x.id === "turso");
    expect(turso.vendor_changed_at).toBeUndefined();
    expect(labelState(turso, now)).toBe("checked");
  });

  it("fails loudly on an imported entry in an unknown aisle", () => {
    const d = copyFixtures();
    const file = join(d, "imported/free-for-dev.yaml");
    writeFileSync(file, readFileSync(file, "utf8").replace("aisle: databases", "aisle: student"));
    const r = run(d);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('unknown aisle "student"');
  });

  it("fails on a tool that breaks the schema or a null metric without a note", () => {
    const d = copyFixtures();
    const file = join(d, "tools/appwrite.yaml");
    writeFileSync(file, readFileSync(file, "utf8").replace(/metric_note: .*\n/, "").replace("sell: unknown", "sell: maybe"));
    const r = run(d);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("tools/appwrite.yaml");
    expect(r.stderr).toContain("metric is null without a metric_note");
  });

  it("reads state/links.yaml: drops dead imported entries, flags dead labeled tools", () => {
    const d = copyFixtures();
    writeFileSync(
      join(d, "state/links.yaml"),
      [
        "xata-lite: { url_status: dns, pricing_status: null, final_url: null, checked_at: 2026-11-20, failing_since: 2026-11-13, dead_since: 2026-11-20 }",
        "neon: { url_status: client_error:404, pricing_status: null, final_url: null, checked_at: 2026-11-20, failing_since: 2026-11-13, dead_since: 2026-11-20 }",
        "turso: { url_status: client_error:404, pricing_status: null, final_url: null, checked_at: 2026-11-13, failing_since: 2026-11-13, dead_since: null }",
        "no-such-tool: { url_status: dns, dead_since: 2026-11-20 }",
      ].join("\n") + "\n",
    );
    const s = generate(d);
    const ids = s.tools.map((x: Tool) => x.id);
    expect(ids).not.toContain("xata-lite");
    expect(s.lists[0].count).toBe(0);
    expect(s.tools.find((x: Tool) => x.id === "neon").link_dead).toBe(true);
    // First strike only: still listed, no flag.
    expect(s.tools.find((x: Tool) => x.id === "turso").link_dead).toBeUndefined();
  });

  it("tolerates a missing or empty links.yaml", () => {
    expect(t("xata-lite")).toBeTruthy();
    expect(snap.tools.some((x: Tool) => x.link_dead)).toBe(false);
    const d = copyFixtures();
    writeFileSync(join(d, "state/links.yaml"), "# nothing yet\n");
    expect(generate(d).tools.map((x: Tool) => x.id)).toContain("xata-lite");
  });

  it("ignores data/imported/denylist.yaml", () => {
    const d = copyFixtures();
    writeFileSync(join(d, "imported/denylist.yaml"), "- id: gone\n  reason: test\n  date: 2026-11-13\n");
    expect(generate(d).lists.map((l: { id: string }) => l.id)).toEqual(["free-for-dev"]);
  });

  it("real data never uses fixture-only relative dates", () => {
    const r = spawnSync("grep", ["-rl", "_days_ago", join(root, "data")], { encoding: "utf8" });
    expect(r.stdout.trim()).toBe("");
  }, 10_000);
});
