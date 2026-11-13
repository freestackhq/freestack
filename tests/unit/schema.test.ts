import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { validateTool } from "../../scripts/lib/validate.mjs";

const dir = join(process.cwd(), "data/tools");
const files = readdirSync(dir).filter((f) => f.endsWith(".yaml"));
const load = (f: string) => parse(readFileSync(join(dir, f), "utf8"));

describe("data/tools/*.yaml", () => {
  it("has tool files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  // One test per file so a failure names the tool.
  for (const f of files) {
    it(`${f} matches schema/tool.schema.json`, () => {
      const tool = load(f);
      expect(validateTool(tool)).toEqual([]);
      expect(`${tool.id}.yaml`).toBe(f);
    });
  }

  it("neon.yaml passes", () => {
    expect(validateTool(load("neon.yaml"))).toEqual([]);
  });

  it("a bad file fails", () => {
    const neon = load("neon.yaml");
    expect(validateTool({ ...neon, sell: "maybe" })).not.toEqual([]);
    expect(validateTool({ ...neon, price: 0 })).not.toEqual([]);
    expect(validateTool({ ...neon, metric: "0.5 GB" })).not.toEqual([]);
    expect(validateTool({ ...neon, who: [] })).not.toEqual([]);
    expect(validateTool({ ...neon, verified_at: "last week" })).not.toEqual([]);
    const { url: _url, ...noUrl } = neon;
    expect(validateTool(noUrl)).not.toEqual([]);
  });
});
