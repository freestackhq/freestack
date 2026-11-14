/**
 * Stack helpers shared by Home, Build a stack, Check my stack and the Copy
 * dialog. Pure functions over plain data: no catalog import, so the browser
 * bundles stay small and the same code runs at build time.
 */
import { headline, isUnlimited, labelState, metricParts, strings } from "./label";
import type { RuleTool } from "./rules";
import type { Aisle, LabelState, Part, SituationId, Tool } from "./types";

/** What the browser needs to know about a tool. Serialized at build time. */
export interface StackTool extends RuleTool {
  kind: string;
  href: string;
  /** "100k requests a day, 10 ms CPU per request" */
  limits: string;
  /** First catch, or null. */
  catch: string | null;
  state: LabelState;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The aisle's headline figure as words: "0.5 GB free storage", "50k users a
 * month". An unknown headline reads "Requests a day: unknown", never a guess.
 */
export function headlineText(t: Tool, a: Aisle): string {
  const h = headline(t, a);
  if (isUnlimited(t)) return t.metric_note ?? "No limit";
  if (t.metric === null && t.metric_note && !/^not listed$/i.test(t.metric_note)) return t.metric_note;
  if (!h.known) return `${cap(metricParts("", a).sub ?? a.label)}: unknown`;
  if (h.sub && h.sub !== t.metric_note) return `${h.big} ${h.sub}`;
  return /^\d/.test(h.big) && a.unit && h.big.endsWith(a.unit) ? `${h.big} ${a.label}` : h.big;
}

/**
 * Leading scale figure of a limit ("50k", "1M"), to spot a line that restates
 * the headline in other words. Plain figures ("5 GB") are left alone: two
 * different limits often share one.
 */
function leadingFigure(s: string): string | null {
  const m = /^\s*([\d.,]+\s*[kmb])\b/i.exec(s);
  return m ? m[1].replace(/\s+/g, "").toLowerCase() : null;
}

/**
 * The other limits, without the catches and without any line that restates
 * the headline figure ("50k MRU free" under "50k users a month").
 */
export function otherLimits(t: Tool, a: Aisle): string[] {
  const first = headlineText(t, a);
  const fig = leadingFigure(first);
  return t.limits.filter(
    (l) => !t.catches.includes(l) && l.toLowerCase() !== first.toLowerCase() && !(fig && leadingFigure(l) === fig),
  );
}

/** One line of limits: the headline figure, then the other limits. */
export function limitsLine(t: Tool, a: Aisle): string {
  return [headlineText(t, a), ...otherLimits(t, a)].join(", ");
}

export function toStackTool(t: Tool, a: Aisle, href: string, now: Date, part?: string): StackTool {
  return {
    id: t.id,
    name: t.name,
    kind: t.kind,
    aisle: t.aisle,
    sell: t.sell,
    card: t.card,
    who: t.who,
    catches: t.catches,
    href,
    limits: limitsLine(t, a),
    catch: t.catches[0] ?? null,
    state: labelState(t, now),
    ...(part ? { part } : {}),
  };
}

/** Status line for a stack row whose label is not freshly checked; null when checked. */
export function rowState(t: Tool, now: Date): { state: LabelState; text: string; link: string | null } | null {
  const s = strings(t, now);
  if (s.state === "checked") return null;
  return { state: s.state, text: s.text, link: s.link };
}

// ---------- URL ----------

export interface ParsedStack {
  situation: SituationId;
  /** part key -> tool id, in part order. */
  picks: Record<string, string>;
  /** Ids in the URL we no longer list. */
  dropped: string[];
}

/**
 * Read `?as=indie&hosting=cf-workers&database=neon`. Unknown situations fall
 * back; tool ids that can't fill their part are dropped and reported.
 */
export function parseStack(
  search: string | URLSearchParams,
  opts: {
    parts: Pick<Part, "key">[];
    canFill: (partKey: string, toolId: string) => boolean;
    situations: SituationId[];
    fallback: SituationId;
  },
): ParsedStack {
  const q = typeof search === "string" ? new URLSearchParams(search) : search;
  const as = q.get("as") as SituationId | null;
  const situation = as && opts.situations.includes(as) ? as : opts.fallback;
  const picks: Record<string, string> = {};
  const dropped: string[] = [];
  for (const p of opts.parts) {
    const id = q.get(p.key)?.trim();
    if (!id) continue;
    if (opts.canFill(p.key, id)) picks[p.key] = id;
    else dropped.push(id);
  }
  return { situation, picks, dropped };
}

/** `?as=indie&hosting=cf-workers&...`, parts in their fixed order. */
export function stackSearch(situation: SituationId, picks: Record<string, string>, parts: Pick<Part, "key">[]): string {
  const q = new URLSearchParams({ as: situation });
  for (const p of parts) if (picks[p.key]) q.set(p.key, picks[p.key]);
  return `?${q.toString()}`;
}

// ---------- Check my stack input ----------

/** "Vercel, Supabase and Clerk" -> ["Vercel", "Supabase", "Clerk"] */
export function splitTools(text: string): string[] {
  return text
    .split(/,|\n|;|\+|\band\b|&(?=\s)/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Find a listed tool by id or name. "vercel" finds "Vercel Hobby" when it is
 * the only name that starts with that word. Returns null when unknown or
 * ambiguous.
 */
export function matchTool<T extends { id: string; name: string }>(text: string, tools: T[]): T | null {
  const n = norm(text);
  if (!n) return null;
  const exact = tools.find((t) => norm(t.id) === n || norm(t.name) === n);
  if (exact) return exact;
  const starts = tools.filter((t) => norm(t.name).startsWith(`${n} `) || norm(t.name).split(" ").includes(n));
  return starts.length === 1 ? starts[0] : null;
}

// ---------- Totals and copy text ----------

/**
 * Sell and card values every part of a stack shares. The panel says those
 * once under the total instead of on every row. One part shares nothing.
 */
export function sharedFacts<T extends { sell: string; card: string }>(
  tools: T[],
): { sell: T["sell"] | null; card: T["card"] | null } {
  const same = (k: "sell" | "card") =>
    tools.length > 1 && tools.every((t) => t[k] === tools[0][k]) ? tools[0][k] : null;
  return { sell: same("sell"), card: same("card") };
}

/** Note under "Total per month", from the card facts. */
export function cardNote(tools: { card: string }[]): string {
  if (tools.length === 0) return "";
  const needs = tools.filter((t) => t.card === "yes").length;
  const unknown = tools.filter((t) => t.card === "unknown").length;
  const parts: string[] = [];
  if (needs) parts.push(`${needs} ${needs === 1 ? "part needs" : "parts need"} a credit card at signup`);
  if (unknown) parts.push(`card unknown for ${unknown} ${unknown === 1 ? "part" : "parts"}`);
  if (!parts.length) return "No card needed for any part";
  return cap(parts.join(", "));
}

export interface CopyRow {
  job: string;
  name: string;
  limits: string;
  catch: string | null;
  /** False when nobody has checked the label lately: copied text says so. */
  checked?: boolean;
}

/** " (not checked yet)" for a row nobody has checked, so pasted text never overstates. */
function checkNote(r: CopyRow): string {
  return r.checked === false ? " (not checked yet)" : "";
}

export interface CopyStackData {
  /** Situation label, "Indie builder". */
  situation: string;
  rows: CopyRow[];
  /** Absolute share link. */
  url: string;
}

/** Markdown for notes, READMEs and group chats. */
export function stackMarkdown(s: CopyStackData): string {
  const lines = ["## My free stack (from freestack)", `For: ${s.situation}`, ""];
  for (const r of s.rows) {
    lines.push(`- ${r.job}: ${r.name}${checkNote(r)}`);
    lines.push(`  ${r.limits}${r.catch ? `. Catch: ${r.catch}` : ""}`);
  }
  lines.push("", "Total per month: $0.00");
  if (s.rows.some((r) => r.checked === false))
    lines.push("Limits from freestack labels. Confirm on each vendor's page before you launch.");
  lines.push(s.url);
  return lines.join("\n");
}

/** A prompt to paste into a coding agent before it scaffolds. */
export function stackPrompt(s: CopyStackData): string {
  const lines = ["Set up this project on these free tiers:"];
  for (const r of s.rows) lines.push(`- ${r.job}: ${r.name} (${r.limits})${checkNote(r)}`);
  lines.push("", "Keep within the free limits.");
  const catches = s.rows.filter((r) => r.catch);
  if (catches.length) {
    lines.push("Warn me if any of these catches is a problem:");
    for (const r of catches) lines.push(`- ${r.name}: ${r.catch}`);
  }
  lines.push("", `Check freestack before adding any paid service. Stack: ${s.url}`);
  return lines.join("\n");
}
