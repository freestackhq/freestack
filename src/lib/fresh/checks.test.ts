import { describe, expect, it } from "vitest";
import { checkLines, checkOutcome, checkSummary, type CheckAnswer } from "./checks";
import type { Aisle, Tool } from "./types";

const db: Aisle = { id: "databases", group: "Build", name: "Databases", metric: "storage_gb", unit: "GB", label: "free storage" };
const hosting: Aisle = { id: "hosting", group: "Build", name: "Hosting", metric: "requests_per_day", unit: "a day", label: "requests" };

function make(over: Partial<Tool>): Tool {
  return {
    id: "x",
    name: "X",
    kind: "Thing",
    url: "https://x.dev",
    aisle: "databases",
    metric: 0.5,
    limits: [],
    who: ["anyone"],
    region: null,
    sell: "yes",
    card: "no",
    catches: [],
    use_if: [],
    skip_if: [],
    pricing_url: "https://x.dev/pricing",
    verified_at: null,
    verified_by: null,
    source: "catalog",
    ...over,
  };
}

describe("checkLines", () => {
  it("lists the headline, each limit, catches not already listed, and the bottom line", () => {
    const lines = checkLines(
      make({ limits: ["5 GB transfer a month", "Sleeps after 5 minutes idle"], catches: ["Sleeps after 5 minutes idle", "No backups"], card: "unknown" }),
      db,
    );
    expect(lines.map((l) => [l.label, l.value])).toEqual([
      ["Free storage", "0.5 GB"],
      ["Limit", "5 GB transfer a month"],
      ["Limit", "Sleeps after 5 minutes idle"],
      ["The catch", "No backups"],
      ["Who can claim it", "Anyone"],
      ["Selling allowed", "Yes"],
      ["Credit card at signup", "Not listed"],
    ]);
    expect(new Set(lines.map((l) => l.id)).size).toBe(lines.length);
    // Each line names where it lives in the tool file, for the issue form.
    expect(lines.map((l) => l.field)).toEqual(["metric", "limits.0", "limits.1", "catches.1", "who", "sell", "card"]);
  });

  it("writes the unit after a non-inline number and admits an unknown one", () => {
    expect(checkLines(make({ metric: 100000 }), hosting)[0]).toMatchObject({ label: "Requests", value: "100k requests a day" });
    expect(checkLines(make({ metric: null }), hosting)[0]).toMatchObject({ value: "Not listed" });
  });

  it("uses how long it lasts for a program", () => {
    const programs: Aisle = { id: "student-programs", group: "Claim Once", name: "Student programs", metric: "duration", unit: "", label: "how long it lasts" };
    const t = make({
      aisle: "student-programs",
      who: ["student_school_email"],
      program: { order: 1, lasts_big: "2 yrs", lasts_sub: "then verify again", perks: ["Copilot"], needs: "School email", lasts: "", claim_url: "" },
    });
    const lines = checkLines(t, programs);
    expect(lines[0]).toMatchObject({ field: "program.lasts", label: "How long it lasts", value: "2 yrs, then verify again" });
    expect(lines[1]).toMatchObject({ field: "program.perks.0", value: "Copilot" });
    expect(lines.map((l) => l.label)).toContain("What you need");
    expect(lines.find((l) => l.label === "Who can claim it")?.value).toBe("Students with a school email");
  });
});

describe("checkOutcome", () => {
  const a = (v: CheckAnswer["verdict"], now?: string): CheckAnswer => ({ id: "l", verdict: v, now });

  it("all still true: checked today", () => {
    expect(checkOutcome([a("holds"), a("holds")])).toEqual({ kind: "checked", changed: 0 });
  });

  it("any changed: waiting for review", () => {
    expect(checkOutcome([a("holds"), a("changed", "1 GB")])).toEqual({ kind: "review", changed: 1 });
  });

  it("nothing answered: nothing to send", () => {
    expect(checkOutcome([])).toEqual({ kind: "empty", changed: 0 });
  });
});

describe("checkSummary", () => {
  it("counts answers", () => {
    expect(checkSummary(2, 4)).toBe("2 of 4 answered. Unanswered lines stay as they are.");
  });
});
