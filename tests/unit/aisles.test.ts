import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const data = (p: string) => parse(readFileSync(join(process.cwd(), "data", p), "utf8"));
const aisles: { id: string; group: string; metric: string; unit: string; label: string }[] = data("aisles.yaml");
const tools = readdirSync(join(process.cwd(), "data/tools"))
  .filter((f) => f.endsWith(".yaml"))
  .map((f) => data(`tools/${f}`));
const byId = new Map(aisles.map((a) => [a.id, a]));

describe("data/aisles.yaml", () => {
  it("uses the four groups only", () => {
    for (const a of aisles) expect(["Build", "AI", "Free and Open Data", "Claim Once"]).toContain(a.group);
  });

  it("aisles that measure different things never share a metric", () => {
    const meaning = new Map<string, string>();
    for (const a of aisles) {
      const m = `${a.unit}|${a.label}`;
      if (meaning.has(a.metric)) expect(meaning.get(a.metric), `${a.id} reuses ${a.metric}`).toBe(m);
      meaning.set(a.metric, m);
    }
  });

  it("keeps the decided metrics", () => {
    expect(byId.get("hosting")).toMatchObject({ name: "Sites and functions", metric: "bandwidth_gb_month" });
    expect(byId.get("servers")).toMatchObject({ name: "Always-on servers", metric: "ram_gb" });
    expect(byId.get("email")?.metric).toBe("emails_per_day");
    expect(byId.get("inference")?.metric).toBe("requests_per_day");
  });

  it("every aisle has a tool", () => {
    for (const a of aisles) expect(tools.some((t) => t.aisle === a.id), a.id).toBe(true);
  });
});

describe("every tool fits its aisle", () => {
  for (const t of tools) {
    it(`${t.id}: metric is a number in the aisle's unit, or null with a metric_note`, () => {
      const a = byId.get(t.aisle);
      expect(a, `unknown aisle ${t.aisle}`).toBeDefined();
      if (t.metric === null) expect(t.metric_note, "null metric needs a metric_note").toBeTruthy();
      else expect(typeof t.metric).toBe("number");
      if (a!.group === "Claim Once") expect(t.program, "Claim Once tools need a program block").toBeDefined();
    });
  }
});

describe("data/imported/*.yaml", () => {
  const dir = join(process.cwd(), "data/imported");
  const files = readdirSync(dir).filter((f) => f.endsWith(".yaml"));
  for (const f of files) {
    it(`${f}: every entry is in a known aisle`, () => {
      const list = data(`imported/${f}`);
      for (const e of list.entries ?? []) expect(byId.has(e.aisle), `${e.id} -> ${e.aisle}`).toBe(true);
    });
  }
});
