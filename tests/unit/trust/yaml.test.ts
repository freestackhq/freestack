import { describe, expect, it } from "vitest";
import { readAisles, readScalar, scalar, setFlowList, setListItem, setScalar } from "../../../scripts/trust/yaml.mjs";

describe("scalar", () => {
  it("keeps everyday text plain and quotes what YAML would misread", () => {
    expect(scalar("5 GB data sent out a month")).toBe("5 GB data sent out a month");
    expect(scalar("https://neon.tech/pricing?a=1")).toBe("https://neon.tech/pricing?a=1");
    expect(scalar("Works with C#")).toBe("Works with C#");
    for (const s of ["yes", "No", "null", "0.5", "1e3", "2026-11-13", "1:20", "a: b", "a #b", "- x", "[x]", "{x}", "'x", " x", "x "]) {
      expect(scalar(s), s).toBe(JSON.stringify(s));
    }
    expect(scalar(null)).toBe("null");
    expect(scalar(0.5)).toBe("0.5");
  });
});

describe("line edits", () => {
  const text = 'metric: 0.5   # note\nkind: "Postgres # db"  # c\nwho:\n  - anyone\n  - startup_proof\nlimits:\n  - a\n  - { reason: x }\n';

  it("reads and sets a scalar without losing its comment", () => {
    expect(readScalar(text, "kind")).toBe("Postgres # db");
    expect(setScalar(text, "kind", "Other")).toContain('kind: Other  # c\n');
    expect(setScalar(text, "metric", "1")).toMatch(/^metric: 1   # note\n/);
  });

  it("turns a block list of ids into one flow line", () => {
    expect(setFlowList(text, "who", ["anyone"])).toContain("who: [anyone]\nlimits:");
  });

  it("refuses list items that are maps or out of range", () => {
    expect(setListItem(text, "limits", 0, "b")).toContain("limits:\n  - b\n");
    expect(setListItem(text, "limits", 1, "b")).toBeNull();
    expect(setListItem(text, "limits", 2, "b")).toBeNull();
    expect(setListItem("limits: [a]\n", "limits", 0, "b")).toBeNull();
  });

  it("reads aisle ids and units", () => {
    expect(readAisles("# x\n- id: databases\n  unit: GB # c\n- id: hosting\n  unit: \"a day\"\n")).toEqual([
      { id: "databases", unit: "GB" },
      { id: "hosting", unit: "a day" },
    ]);
  });
});
