/**
 * Rules engine for Build a stack, Check my stack (and later the MCP
 * suggest_stack tool). Pure functions, no DOM and no data imports, so the
 * same code runs at build time and in the browser.
 *
 * RULES mirrors data/rules.yaml. The build has no YAML loader yet, so the
 * rules are embedded here as a typed array; rules.test.ts fails if the two
 * drift apart. When the data phase adds a loader, generate this array from
 * the YAML instead.
 */
import type { SituationId, Who, YesNoUnknown } from "./types";

export type Level = "problem" | "watch";

/** What a rule matches on the tool it is checking. All given keys must match. */
export interface ToolMatch {
  id?: string;
  sell?: YesNoUnknown;
  card?: YesNoUnknown;
  /** The tool is open to this group and nobody else. */
  who_only?: Who;
  /** Some catch contains this text (case-insensitive). */
  catches_contains?: string;
}

export interface When {
  /** Only for these situations. */
  situation?: SituationId[];
  /** Not for these situations. */
  situation_not?: SituationId[];
  tool: ToolMatch;
  /** Fires when the stack has no tool with this id in this aisle. */
  missing?: { aisle: string; id: string };
  /** Fires when another tool in the stack sits in this aisle ({other}). */
  has?: { aisle: string };
}

export interface Rule {
  id: string;
  level: Level;
  when: When;
  /** Template: {tool}, {aisle}, {other}, {catch}. */
  text: string;
  /** A few words for the picker's fit column. */
  short: string;
}

/** The slice of a tool the engine reads. */
export interface RuleTool {
  id: string;
  name: string;
  aisle: string;
  sell: YesNoUnknown;
  card: YesNoUnknown;
  who: Who[];
  catches: string[];
  /** The job it does in this stack ("Hosting"). Used for {aisle}. */
  part?: string;
}

export interface StackInput {
  situation: SituationId;
  tools: RuleTool[];
}

export interface Finding {
  rule: string;
  level: Level;
  /** The tool the rule fired on. */
  tool: string;
  text: string;
  short: string;
}

export interface Result {
  problems: Finding[];
  watch: Finding[];
}

// Keep in step with data/rules.yaml.
export const RULES: Rule[] = [
  {
    id: "no-selling",
    level: "problem",
    when: { situation: ["indie", "startup"], tool: { sell: "no" } },
    text: "{tool} does not allow selling, and you are building to sell. Swap {aisle}.",
    short: "Clashes: no selling",
  },
  {
    id: "d1-needs-workers",
    level: "problem",
    when: { tool: { id: "d1" }, missing: { aisle: "hosting", id: "cf-workers" } },
    text: "Cloudflare D1 only runs inside Cloudflare Workers. Pair it with Cloudflare hosting.",
    short: "Needs Cloudflare hosting",
  },
  {
    id: "school-email-only",
    level: "problem",
    when: { situation_not: ["school"], tool: { who_only: "student_school_email" } },
    text: "{tool}'s free plan needs a school email.",
    short: "Needs a school email",
  },
  {
    id: "card-needed",
    level: "watch",
    when: { tool: { card: "yes" } },
    text: "{tool} asks for a credit card at signup.",
    short: "Card needed at signup",
  },
  {
    id: "auth-built-in",
    level: "watch",
    when: { tool: { id: "supabase" }, has: { aisle: "auth" } },
    text: "Supabase already has sign-in built in. You may not need {other}.",
    short: "Has sign-in built in",
  },
  {
    id: "sleeps",
    level: "watch",
    when: { tool: { catches_contains: "Sleeps" } },
    text: "{tool}: {catch}. The first visit after a break is slow.",
    short: "Sleeps when idle",
  },
];

function matchTool(m: ToolMatch, t: RuleTool): { ok: boolean; catch?: string } {
  if (m.id !== undefined && t.id !== m.id) return { ok: false };
  if (m.sell !== undefined && t.sell !== m.sell) return { ok: false };
  if (m.card !== undefined && t.card !== m.card) return { ok: false };
  if (m.who_only !== undefined && !(t.who.length > 0 && t.who.every((w) => w === m.who_only))) return { ok: false };
  if (m.catches_contains !== undefined) {
    const needle = m.catches_contains.toLowerCase();
    const hit = t.catches.find((c) => c.toLowerCase().includes(needle));
    if (!hit) return { ok: false };
    return { ok: true, catch: hit };
  }
  return { ok: true };
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (all, key: string) => vars[key] ?? all);
}

/** Lower-case a job name for mid-sentence use, keeping words like "AI". */
function midSentence(s: string): string {
  return s.length > 1 && s[1] === s[1].toUpperCase() && /[A-Z]/.test(s[1]) ? s : s.charAt(0).toLowerCase() + s.slice(1);
}

/** Run every rule against the stack. Problems first, then things to watch. */
export function evaluate(input: StackInput, rules: Rule[] = RULES): Result {
  const out: Result = { problems: [], watch: [] };
  for (const rule of rules) {
    const w = rule.when;
    if (w.situation && !w.situation.includes(input.situation)) continue;
    if (w.situation_not && w.situation_not.includes(input.situation)) continue;
    for (const t of input.tools) {
      const m = matchTool(w.tool, t);
      if (!m.ok) continue;
      if (w.missing && input.tools.some((o) => o.aisle === w.missing!.aisle && o.id === w.missing!.id)) continue;
      let other = "";
      if (w.has) {
        const others = input.tools.filter((o) => o !== t && o.aisle === w.has!.aisle);
        if (others.length === 0) continue;
        other = others.map((o) => o.name).join(" or ");
      }
      const text = fill(rule.text, {
        tool: t.name,
        aisle: midSentence(t.part ?? t.aisle),
        other,
        catch: m.catch ?? "",
      });
      const finding: Finding = { rule: rule.id, level: rule.level, tool: t.id, text, short: rule.short };
      (rule.level === "problem" ? out.problems : out.watch).push(finding);
    }
  }
  return out;
}

/** "1 problem, 1 to watch", "Works. 2 to watch", "Works. No problems found". */
export function summary(r: Result): string {
  const p = r.problems.length;
  const w = r.watch.length;
  if (p > 0) return `${p} ${p === 1 ? "problem" : "problems"}${w ? `, ${w} to watch` : ""}`;
  return w ? `Works. ${w} to watch` : "Works. No problems found";
}

/**
 * How a candidate fits the stack if it replaced `replacing` (or was added).
 * Returns the first problem the swap would add: one on the candidate itself
 * first, then one it causes on another part (f.tool tells which). Null when
 * it fits.
 */
export function fitFor(candidate: RuleTool, input: StackInput, replacing?: string): Finding | null {
  const key = (f: Finding) => `${f.rule}:${f.tool}`;
  const before = new Set(evaluate(input).problems.map(key));
  const tools = input.tools.filter((t) => t.id !== replacing && t.id !== candidate.id).concat(candidate);
  const added = evaluate({ situation: input.situation, tools }).problems.filter((f) => !before.has(key(f)) || f.tool === candidate.id);
  return added.find((f) => f.tool === candidate.id) ?? added[0] ?? null;
}

/**
 * A swap that clears every problem on `toolId`: the first candidate (in the
 * caller's order) from the same aisle that adds no new problem anywhere.
 */
export function bestSwap(toolId: string, input: StackInput, candidates: RuleTool[]): RuleTool | null {
  const current = input.tools.find((t) => t.id === toolId);
  if (!current) return null;
  const key = (f: Finding) => `${f.rule}:${f.tool}`;
  const kept = new Set(evaluate(input).problems.filter((f) => f.tool !== toolId).map(key));
  for (const c of candidates) {
    if (c.id === toolId || c.aisle !== current.aisle) continue;
    if (input.tools.some((t) => t.id === c.id)) continue;
    const tools = input.tools.map((t) => (t.id === toolId ? { ...c, part: current.part } : t));
    const after = evaluate({ situation: input.situation, tools }).problems;
    if (after.every((f) => kept.has(key(f)))) return c;
  }
  return null;
}
