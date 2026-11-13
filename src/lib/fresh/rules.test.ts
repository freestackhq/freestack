import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { RULES, bestSwap, evaluate, fitFor, summary, type RuleTool } from "./rules";

function t(over: Partial<RuleTool> & { id: string }): RuleTool {
  return {
    name: over.id.toUpperCase(),
    aisle: "databases",
    sell: "yes",
    card: "no",
    who: ["anyone"],
    catches: [],
    ...over,
  };
}

const workers = t({ id: "cf-workers", name: "Cloudflare Workers & Pages", aisle: "hosting", part: "Hosting" });
const vercel = t({ id: "vercel-hobby", name: "Vercel Hobby", aisle: "hosting", sell: "no", part: "Hosting" });
const koyeb = t({ id: "koyeb", name: "Koyeb", aisle: "hosting", card: "unknown", part: "Hosting" });
const d1 = t({ id: "d1", name: "Cloudflare D1" });
const neon = t({ id: "neon", name: "Neon", catches: ["Sleeps after 5 minutes idle"], part: "Database" });
const supabase = t({ id: "supabase", name: "Supabase", catches: ["Pauses after 1 week idle"] });
const clerk = t({ id: "clerk", name: "Clerk", aisle: "auth", part: "Sign-in" });
const doppler = t({ id: "doppler", name: "Doppler", aisle: "auth", who: ["student_school_email"], sell: "unknown" });
const pack = t({ id: "pack", name: "Pack", aisle: "student-programs", who: ["student_school_email", "student_any_id"] });
const r2 = t({ id: "r2", name: "Cloudflare R2", aisle: "storage", card: "yes" });

describe("rules engine", () => {
  it("no parts: nothing to report", () => {
    const r = evaluate({ situation: "indie", tools: [] });
    expect(r).toEqual({ problems: [], watch: [] });
    expect(summary(r)).toBe("Works. No problems found");
  });

  it("all fine", () => {
    const r = evaluate({ situation: "indie", tools: [workers, clerk] });
    expect(r.problems).toEqual([]);
    expect(r.watch).toEqual([]);
    expect(summary(r)).toBe("Works. No problems found");
  });

  describe("no-selling", () => {
    it("fires for indie and startup, with the part name filled in", () => {
      for (const situation of ["indie", "startup"] as const) {
        const r = evaluate({ situation, tools: [vercel] });
        expect(r.problems).toEqual([
          {
            rule: "no-selling",
            level: "problem",
            tool: "vercel-hobby",
            text: "Vercel Hobby does not allow selling, and you are building to sell. Swap hosting.",
            short: "Clashes: no selling",
          },
        ]);
      }
    });
    it("stays quiet for students", () => {
      expect(evaluate({ situation: "student", tools: [vercel] }).problems).toEqual([]);
      expect(evaluate({ situation: "school", tools: [vercel] }).problems).toEqual([]);
    });
    it("unknown selling is not a no", () => {
      expect(evaluate({ situation: "indie", tools: [t({ id: "x", sell: "unknown" })] }).problems).toEqual([]);
    });
    it("falls back to the aisle id when no part is given", () => {
      const r = evaluate({ situation: "indie", tools: [{ ...vercel, part: undefined }] });
      expect(r.problems[0].text).toMatch(/Swap hosting\.$/);
    });
  });

  describe("d1-needs-workers", () => {
    it("fires when Workers is missing", () => {
      const r = evaluate({ situation: "student", tools: [d1] });
      expect(r.problems.map((f) => f.rule)).toEqual(["d1-needs-workers"]);
      expect(r.problems[0].text).toBe("Cloudflare D1 only runs inside Cloudflare Workers. Pair it with Cloudflare hosting.");
    });
    it("fires with other hosting", () => {
      expect(evaluate({ situation: "student", tools: [koyeb, d1] }).problems.map((f) => f.rule)).toEqual(["d1-needs-workers"]);
    });
    it("is fine with Workers", () => {
      expect(evaluate({ situation: "student", tools: [workers, d1] }).problems).toEqual([]);
    });
  });

  describe("school-email-only", () => {
    it("fires for anyone without a school email", () => {
      for (const situation of ["student", "indie", "startup"] as const) {
        const r = evaluate({ situation, tools: [doppler] });
        expect(r.problems.map((f) => f.text)).toEqual(["Doppler's free plan needs a school email."]);
      }
    });
    it("is fine with a school email", () => {
      expect(evaluate({ situation: "school", tools: [doppler] }).problems).toEqual([]);
    });
    it("only when the school email is the only way in", () => {
      expect(evaluate({ situation: "student", tools: [pack] }).problems).toEqual([]);
    });
  });

  it("card-needed is a thing to watch", () => {
    const r = evaluate({ situation: "student", tools: [r2] });
    expect(r.problems).toEqual([]);
    expect(r.watch.map((f) => f.text)).toEqual(["Cloudflare R2 asks for a credit card at signup."]);
  });

  describe("auth-built-in", () => {
    it("names the sign-in tool", () => {
      const r = evaluate({ situation: "indie", tools: [supabase, clerk] });
      expect(r.watch.map((f) => f.text)).toEqual(["Supabase already has sign-in built in. You may not need Clerk."]);
    });
    it("stays quiet without a sign-in tool", () => {
      expect(evaluate({ situation: "indie", tools: [supabase] }).watch).toEqual([]);
    });
  });

  it("sleeps quotes the catch", () => {
    const r = evaluate({ situation: "student", tools: [neon] });
    expect(r.watch.map((f) => f.text)).toEqual(["Neon: Sleeps after 5 minutes idle. The first visit after a break is slow."]);
  });

  it("puts problems before things to watch and counts them", () => {
    const r = evaluate({ situation: "indie", tools: [vercel, supabase, clerk] });
    expect(r.problems).toHaveLength(1);
    expect(r.watch).toHaveLength(1);
    expect(summary(r)).toBe("1 problem, 1 to watch");
    expect(summary(evaluate({ situation: "student", tools: [neon] }))).toBe("Works. 1 to watch");
    expect(summary(evaluate({ situation: "indie", tools: [vercel, doppler] }))).toBe("2 problems");
  });

  it("fitFor reports the clash a candidate would add", () => {
    const input = { situation: "indie" as const, tools: [workers] };
    expect(fitFor(vercel, input, "cf-workers")?.short).toBe("Clashes: no selling");
    expect(fitFor(d1, input)).toBeNull();
    expect(fitFor(d1, { situation: "indie", tools: [koyeb] })?.short).toBe("Needs Cloudflare hosting");
    expect(fitFor(d1, input, "cf-workers")?.short).toBe("Needs Cloudflare hosting");
  });

  it("fitFor also reports a part the swap would break", () => {
    const input = { situation: "indie" as const, tools: [workers, d1] };
    const f = fitFor(koyeb, input, "cf-workers");
    expect(f?.tool).toBe("d1");
    expect(f?.rule).toBe("d1-needs-workers");
    // A problem that was already there is not blamed on the candidate.
    expect(fitFor(clerk, { situation: "indie", tools: [vercel] })).toBeNull();
  });

  it("bestSwap picks the first candidate that clears the problem", () => {
    const input = { situation: "indie" as const, tools: [vercel, neon] };
    expect(bestSwap("vercel-hobby", input, [vercel, workers, koyeb])?.id).toBe("cf-workers");
    // Swapping Workers away from D1 would add a problem, so Koyeb is skipped.
    const withD1 = { situation: "indie" as const, tools: [workers, d1] };
    expect(bestSwap("cf-workers", withD1, [koyeb])).toBeNull();
    expect(bestSwap("missing", input, [workers])).toBeNull();
  });

  it("is compiled from data/rules.yaml", () => {
    const yaml = parse(readFileSync(new URL("../../../data/rules.yaml", import.meta.url), "utf8"));
    expect(RULES).toEqual(yaml);
  });
});
