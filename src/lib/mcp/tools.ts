/**
 * The four freestack MCP tools. They read the catalog only through
 * catalog.ts's exported functions (passed in, so tests can add entries) and
 * reuse the same logic as the pages: compare.ts for Compare, rules.ts and
 * stack.ts for Build a stack, programs.ts for Claim Once.
 *
 * Unknown stays null (and reads "unknown"); nothing is estimated. Imported
 * entries come from awesome lists nobody here has checked, so they return
 * structured fields only and never their free text, to keep prompt injection
 * out of the agent's context.
 */
import type * as CatalogModule from "../fresh/catalog";
import { compareHref, headlineCell, isUnknownCell, parseIds, resolve, rows, aisleSplit, type Cell } from "../fresh/compare";
import { headline, isSuggested, labelState, strings } from "../fresh/label";
import { canClaim, HAVE_OPTIONS, type Have } from "../fresh/programs";
import { RULES, bestSwap, evaluate, fitFor, summary, type Finding, type RuleTool } from "../fresh/rules";
import { stackSearch, toStackTool, type StackTool } from "../fresh/stack";
import type { Part, SituationId, Tool } from "../fresh/types";
import { InvalidParams, type McpTool } from "./protocol";
import type { Schema } from "./schema";

export type Catalog = Pick<
  typeof CatalogModule,
  | "aisles"
  | "aisle"
  | "tool"
  | "toolsInAisle"
  | "unlabeledInAisle"
  | "situations"
  | "preset"
  | "partForJob"
  | "parts"
  | "partOptions"
  | "programsInAisle"
  | "toolHref"
  | "now"
>;

export interface ToolContext {
  cat: Catalog;
  /** Absolute URL on this site for a path. */
  siteUrl: (path: string) => string;
}

// ---------- Shared shapes ----------

/** Which "I have" answer each situation implies (Claim Once and eligibility). */
const HAVE_FOR: Record<SituationId, Have> = { school: "school", student: "id", indie: "none", startup: "none" };

/** Free text from an unchecked source: one line, no control characters, capped. */
function plain(s: string | undefined, max = 80): string | null {
  if (!s) return null;
  const out = s.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return out ? out.slice(0, max) : null;
}

function httpUrl(s: string): string | null {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export interface ImportedEntry {
  id: string;
  name: string | null;
  url: string | null;
  aisle: string;
  imported_from: string | null;
  source: "imported";
  label_url: string;
}

/** An awesome-list entry: structured fields only. */
export function importedEntry(t: Tool, ctx: ToolContext): ImportedEntry {
  return {
    id: t.id,
    name: plain(t.name),
    url: httpUrl(t.url),
    aisle: t.aisle,
    imported_from: plain(t.imported_from, 60),
    source: "imported",
    label_url: ctx.siteUrl(ctx.cat.toolHref(t)),
  };
}

/** A labeled tool, as search_tools returns it. */
export function labeledEntry(t: Tool, ctx: ToolContext) {
  const at = ctx.cat.now();
  const a = ctx.cat.aisle(t.aisle);
  const h = a ? headline(t, a) : null;
  const s = strings(t, at);
  return {
    id: t.id,
    name: t.name,
    kind: t.kind,
    aisle: t.aisle,
    aisle_name: a?.name ?? null,
    /** The aisle's headline figure. null = not listed: say "unknown". */
    metric: t.metric,
    unit: a?.unit ?? null,
    measures: a?.label ?? null,
    metric_note: t.metric_note ?? null,
    metric_text: h?.known ? [h.big, h.sub].filter(Boolean).join(" ") : "unknown",
    label: { state: labelState(t, at), text: s.text, checked_at: t.verified_at, checked_by: t.verified_by },
    suggested: isSuggested(t, at),
    sell: t.sell,
    card: t.card,
    who: t.who,
    catches: t.catches,
    limits: t.limits,
    use_if: t.use_if,
    skip_if: t.skip_if.map((k) => ({ reason: k.reason, use: k.use ?? null })),
    region: t.region,
    url: t.url,
    pricing_url: t.pricing_url,
    label_url: ctx.siteUrl(ctx.cat.toolHref(t)),
    source: t.source,
  };
}

export function entryFor(t: Tool, ctx: ToolContext) {
  return t.source === "imported" ? importedEntry(t, ctx) : labeledEntry(t, ctx);
}

/** Open to someone in this situation, and no rule that needs only this tool flags it. */
export function fitsSituation(t: Tool, situation: SituationId): boolean {
  const open = canClaim(t.who, HAVE_FOR[situation]) || (situation === "startup" && t.who.includes("startup_proof"));
  if (!open) return false;
  const selfRules = RULES.filter((r) => !r.when.missing && !r.when.has);
  return evaluate({ situation, tools: [t] }, selfRules).problems.length === 0;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim();
}

// ---------- search_tools ----------

export function searchTools(args: Record<string, unknown>, ctx: ToolContext) {
  const { cat } = ctx;
  const query = typeof args.query === "string" ? norm(args.query) : "";
  const words = query.split(" ").filter(Boolean);
  const aisleId = args.aisle as string | undefined;
  const situation = args.situation as SituationId | undefined;
  const mustSell = args.can_sell === true;
  const noCard = args.no_card === true;
  const limit = (args.limit as number | undefined) ?? 10;
  const labeledOnly = Boolean(situation || mustSell || noCard);

  // Catalog order: aisle by aisle, Suggested first, then imported entries.
  const pool: Tool[] = [];
  for (const a of cat.aisles()) {
    if (aisleId && a.id !== aisleId) continue;
    pool.push(...cat.toolsInAisle(a.id));
    if (!labeledOnly) pool.push(...cat.unlabeledInAisle(a.id));
  }

  const scored: { t: Tool; score: number; i: number }[] = [];
  pool.forEach((t, i) => {
    if (situation && !fitsSituation(t, situation)) return;
    if (mustSell && t.sell !== "yes") return;
    if (noCard && t.card !== "no") return;
    if (!words.length) return void scored.push({ t, score: 0, i });
    const name = norm(t.name);
    // Imported entries match on id and name only: their other text is unchecked.
    const hay =
      t.source === "imported"
        ? `${norm(t.id)} ${name}`
        : [t.id, t.name, t.kind, t.aisle, cat.aisle(t.aisle)?.name ?? "", t.tagline ?? "", ...t.limits, ...t.catches, ...t.use_if].map(norm).join(" ");
    if (!words.every((w) => hay.includes(w))) return;
    const score = name === query ? 0 : name.startsWith(query) ? 1 : words.every((w) => name.includes(w)) ? 2 : 3;
    scored.push({ t, score, i });
  });
  scored.sort((a, b) => a.score - b.score || a.i - b.i);

  return {
    count: scored.length,
    shown: Math.min(limit, scored.length),
    tools: scored.slice(0, limit).map((s) => entryFor(s.t, ctx)),
    note: "metric null means the vendor does not list it: say unknown, never estimate. Imported entries are unchecked and carry no numbers.",
  };
}

// ---------- compare ----------

function cellValue(c: Cell): string {
  if (c.kind === "flag") return c.value;
  if ((c.big && c.muted) || isUnknownCell(c)) return "unknown";
  return c.lines.join("; ");
}

export function compareTools(args: Record<string, unknown>, ctx: ToolContext) {
  const { cat } = ctx;
  const ids = parseIds((args.ids as string[]).join(","));
  const sel = resolve(ids, cat.tool);
  const labeled = sel.tools.filter((t) => t.source !== "imported");
  const imported = sel.tools.filter((t) => t.source === "imported");
  const { main, others } = aisleSplit(labeled);
  const a = cat.aisle(main);

  return {
    aisle: a ? { id: a.id, name: a.name, measures: a.label, unit: a.unit } : null,
    tools: labeled.map((t) => {
      const h = a ? headlineCell(t, a) : null;
      return {
        id: t.id,
        name: t.name,
        aisle: t.aisle,
        metric: t.metric,
        metric_text: h?.known ? [h.big, h.sub].filter(Boolean).join(" ") : "unknown",
        label_url: ctx.siteUrl(cat.toolHref(t)),
      };
    }),
    rows: a ? rows(labeled, a, cat.now()).map((r) => ({ label: r.label, differs: r.diff, values: r.cells.map(cellValue) })) : [],
    other_aisle: others.map((t) => t.id),
    unknown_ids: sel.dropped,
    unlabeled: imported.map((t) => importedEntry(t, ctx)),
    compare_url: ctx.siteUrl(compareHref(sel.tools.map((t) => t.id))),
  };
}

// ---------- suggest_stack ----------

type From = "you" | "preset" | "suggested";

export function suggestStack(args: Record<string, unknown>, ctx: ToolContext) {
  const { cat } = ctx;
  const at = cat.now();
  const situation = args.situation as SituationId;
  const given = (args.parts ?? {}) as Record<string, string>;
  const fill = args.fill !== false;
  const allParts = cat.parts();
  const options = new Map(allParts.map((p) => [p.key, cat.partOptions(p, at)]));
  const canFill = (key: string, id: string) => Boolean(options.get(key)?.some((t) => t.id === id));

  const picks = new Map<string, { t: Tool; from: From }>();
  const dropped: { part: string; id: string; reason: string }[] = [];
  for (const [key, raw] of Object.entries(given)) {
    const id = raw.trim().toLowerCase();
    const t = cat.tool(id);
    if (t && canFill(key, id)) picks.set(key, { t, from: "you" });
    else dropped.push({ part: key, id, reason: t ? "cannot fill this part" : "not in the catalog" });
  }

  const asRule = (t: Tool, p: Part): RuleTool => ({ ...t, part: p.label });
  const current = () => ({
    situation,
    tools: allParts.flatMap((p) => (picks.has(p.key) ? [asRule(picks.get(p.key)!.t, p)] : [])),
  });

  if (fill) {
    // The situation's preset first, then the first checked option that adds no problem.
    for (const row of cat.preset(situation)) {
      const p = cat.partForJob(row.job);
      if (p && !picks.has(p.key) && labelState(row.t, at) === "checked" && canFill(p.key, row.t.id)) picks.set(p.key, { t: row.t, from: "preset" });
    }
    for (const p of allParts) {
      if (!p.core || picks.has(p.key)) continue;
      const pick = options.get(p.key)!.find((t) => labelState(t, at) === "checked" && fitFor(asRule(t, p), current()) === null);
      if (pick) picks.set(p.key, { t: pick, from: "suggested" });
    }
  }

  const stack: { p: Part; s: StackTool; t: Tool; from: From }[] = [];
  for (const p of allParts) {
    const pick = picks.get(p.key);
    const a = pick && cat.aisle(pick.t.aisle);
    if (pick && a) stack.push({ p, t: pick.t, from: pick.from, s: toStackTool(pick.t, a, cat.toolHref(pick.t), at, p.label) });
  }
  const input = { situation, tools: stack.map((x) => x.s) };
  const result = evaluate(input);

  const partOf = (id: string) => stack.find((x) => x.t.id === id)?.p;
  const finding = (f: Finding) => {
    const p = partOf(f.tool);
    let swap: { id: string; name: string } | null = null;
    if (f.level === "problem" && p) {
      const candidates = options
        .get(p.key)!
        .filter((t) => labelState(t, at) === "checked")
        .flatMap((t) => {
          const a = cat.aisle(t.aisle);
          return a ? [toStackTool(t, a, cat.toolHref(t), at, p.label)] : [];
        });
      const best = bestSwap(f.tool, input, candidates);
      if (best) swap = { id: best.id, name: best.name };
    }
    return { rule: f.rule, level: f.level, tool: f.tool, part: p?.key ?? null, text: f.text, swap };
  };

  const sitLabel = cat.situations().find((s) => s.id === situation)?.label ?? situation;
  const keys = Object.fromEntries(stack.map((x) => [x.p.key, x.t.id]));
  return {
    situation: { id: situation, label: sitLabel },
    picks: stack.map(({ p, s, t, from }) => ({
      part: p.key,
      job: p.label,
      id: t.id,
      name: t.name,
      from,
      limits: s.limits,
      catch: s.catch,
      sell: t.sell,
      card: t.card,
      label: { state: s.state, text: strings(t, at).text },
      label_url: ctx.siteUrl(s.href),
    })),
    summary: summary(result),
    problems: result.problems.map(finding),
    watch: result.watch.map(finding),
    empty_parts: allParts.filter((p) => p.core && !picks.has(p.key)).map((p) => p.key),
    dropped,
    build_url: ctx.siteUrl(`/build${stackSearch(situation, keys, allParts)}`),
  };
}

// ---------- claim_order ----------

export function claimOrder(args: Record<string, unknown>, ctx: ToolContext) {
  const { cat } = ctx;
  const situation = args.situation as SituationId | undefined;
  const hasFlags = typeof args.school_email === "boolean" || typeof args.student_id === "boolean";
  if (!situation && !hasFlags) throw new InvalidParams("give a situation, or school_email / student_id");
  const have: Have = args.school_email === true ? "school" : args.student_id === true ? "id" : hasFlags ? "none" : HAVE_FOR[situation!];

  const at = cat.now();
  const programs = cat
    .aisles()
    .filter((a) => a.group === "Claim Once")
    .flatMap((a) => cat.programsInAisle(a.id))
    .filter((t) => t.source !== "imported" && t.program);
  const ok = programs.filter((t) => canClaim(t.who, have));

  return {
    have,
    have_label: HAVE_OPTIONS.find((o) => o.id === have)!.label,
    programs: ok.map((t, i) => {
      const p = t.program!;
      return {
        step: i + 1,
        id: t.id,
        name: t.name,
        aisle: t.aisle,
        lasts: p.lasts,
        lasts_big: p.lasts_big,
        lasts_sub: p.lasts_sub,
        needs: p.needs,
        perks: p.perks,
        who: t.who,
        catches: t.catches,
        claim_url: p.claim_url,
        label: { state: labelState(t, at), text: strings(t, at).text },
        label_url: ctx.siteUrl(cat.toolHref(t)),
      };
    }),
    not_eligible: programs.filter((t) => !ok.includes(t)).map((t) => ({ id: t.id, name: t.name, needs: t.program!.needs })),
  };
}

// ---------- Definitions ----------

export function freestackTools(ctx: ToolContext): McpTool[] {
  const { cat } = ctx;
  const aisleIds = cat.aisles().map((a) => a.id);
  const situationIds = cat.situations().map((s) => s.id);
  const situationText = cat
    .situations()
    .map((s) => `${s.id} (${s.label})`)
    .join(", ");
  const situation: Schema = { type: "string", enum: situationIds, description: `Who is building: ${situationText}.` };
  const partProps: Record<string, Schema> = Object.fromEntries(
    cat.parts().map((p) => [p.key, { type: "string", minLength: 1, maxLength: 80, description: `Tool id for ${p.label}.` } as Schema]),
  );

  return [
    {
      name: "search_tools",
      title: "Find free tools",
      description:
        "Search freestack's free-tier labels by text, aisle and must-haves. Each result has the aisle's headline limit (metric + unit; null means not listed, say unknown), other limits, who can claim it, whether you can sell, whether signup needs a card, the catches, and the label's check state. Imported entries are unchecked and return only id, name, url, aisle and imported_from.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", maxLength: 200, description: "Words to match, e.g. \"postgres\" or \"redis\"." },
          aisle: { type: "string", enum: aisleIds, description: "Only this aisle." },
          situation,
          can_sell: { type: "boolean", description: "true keeps only tools whose terms allow selling (unknown is left out)." },
          no_card: { type: "boolean", description: "true keeps only tools that need no credit card at signup (unknown is left out)." },
          limit: { type: "integer", minimum: 1, maximum: 50, description: "Max results, default 10." },
        },
        additionalProperties: false,
      },
      run: (args) => searchTools(args, ctx),
    },
    {
      name: "compare",
      title: "Compare labels",
      description:
        "Compare 2 to 4 tools side by side, row by row like freestack's compare page: headline limit, other caps, the catch, who can claim, can sell, credit card, when it was checked. Unknown ids are reported, not guessed.",
      inputSchema: {
        type: "object",
        properties: {
          ids: { type: "array", items: { type: "string", minLength: 1, maxLength: 80 }, minItems: 2, maxItems: 4, description: "Tool ids, e.g. [\"neon\", \"turso\"]." },
        },
        required: ["ids"],
        additionalProperties: false,
      },
      run: (args) => compareTools(args, ctx),
    },
    {
      name: "suggest_stack",
      title: "Suggest or check a stack",
      description:
        "One free pick per job (hosting, database, sign-in, ...) for who is building, checked by the same rules engine as freestack's Build a stack: problems (e.g. a tool that forbids selling when you build to sell) and things to watch, each problem with a swap when one fits. Pass parts to check your own picks; missing core parts are filled unless fill is false. Returns a shareable /build link.",
      inputSchema: {
        type: "object",
        properties: {
          situation,
          parts: { type: "object", properties: partProps, additionalProperties: false, description: "Picks keyed by part, like the /build URL: {\"hosting\": \"cf-workers\"}." },
          fill: { type: "boolean", description: "Fill empty core parts with a suggestion. Default true." },
        },
        required: ["situation"],
        additionalProperties: false,
      },
      run: (args) => suggestStack(args, ctx),
    },
    {
      name: "claim_order",
      title: "Claim Once order",
      description:
        "Claim Once programs (student packs and the like) in the order worth claiming, with how long each lasts and what it needs. Give a situation, or what you have: school_email and/or student_id.",
      inputSchema: {
        type: "object",
        properties: {
          situation,
          school_email: { type: "boolean", description: "You have a school email address." },
          student_id: { type: "boolean", description: "You have a student ID (no school email needed)." },
        },
        additionalProperties: false,
      },
      run: (args) => claimOrder(args, ctx),
    },
  ];
}
