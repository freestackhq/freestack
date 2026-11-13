import type { Aisle, LabelState, Tool } from "./types";

export const RECHECK_DAYS = 90;
const DAY = 86_400_000;

export const SCALE_WORDS = ["Small", "Fair", "Medium", "Big", "Biggest"] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function daysSince(iso: string, now: Date): number {
  const then = parseDate(iso).getTime();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - then) / DAY);
}

/** "24 Jul" */
export function shortDate(iso: string): string {
  const d = parseDate(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "13 Nov 2026" */
export function longDate(iso: string): string {
  const d = parseDate(iso);
  return `${shortDate(iso)} ${d.getUTCFullYear()}`;
}

/**
 * Label state, in priority order: imported, change waiting for review,
 * vendor changed, then by age of the last check.
 */
export function labelState(tool: Tool, now: Date): LabelState {
  if (tool.source === "imported") return "imported";
  if (tool.review_pending) return "review";
  if (tool.vendor_changed_at) return "vendor-changed";
  if (!tool.verified_at) return "unchecked";
  return daysSince(tool.verified_at, now) > RECHECK_DAYS ? "overdue" : "checked";
}

/** Only a label checked within 90 days can be Suggested. */
export function isSuggested(tool: Tool, now: Date): boolean {
  return Boolean(tool.suggested) && labelState(tool, now) === "checked";
}

export type ScaleResult =
  | { kind: "step"; step: 1 | 2 | 3 | 4 | 5; word: string }
  | { kind: "unknown"; word: "Not listed" }
  | { kind: "unlimited"; word: string };

export function isUnlimited(tool: Tool): boolean {
  return tool.metric === null && /no limit/i.test(tool.metric_note ?? "");
}

/** Biggest known headline value in the aisle. */
export function aisleMax(tools: Tool[]): number {
  return tools.reduce((m, t) => (t.metric !== null && t.metric > m ? t.metric : m), 0);
}

/** 5-step scale: ceil(value / aisle_max * 5), clamped to 1..5. */
export function scaleStep(tool: Tool, max: number): ScaleResult {
  if (isUnlimited(tool)) return { kind: "unlimited", word: "Your own disk" };
  if (tool.metric === null || max <= 0) return { kind: "unknown", word: "Not listed" };
  const raw = Math.ceil((tool.metric / max) * 5);
  const step = Math.min(5, Math.max(1, raw)) as 1 | 2 | 3 | 4 | 5;
  return { kind: "step", step, word: SCALE_WORDS[step - 1] };
}

/** Compact number: 100000 -> "100k", 1500000 -> "1.5M", 0.5 -> "0.5". */
export function compactNumber(n: number): string {
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, ""));
  if (n >= 1_000_000) return `${fmt(n / 1_000_000)}M`;
  if (n >= 10_000) return `${fmt(n / 1_000)}k`;
  if (n >= 1_000) return n.toLocaleString("en-US");
  return fmt(n);
}

/** Units short enough to sit next to the big number ("0.5 GB"). */
const INLINE_UNITS = new Set(["GB", "MB", "TB"]);

export interface HeadlineParts {
  /** Big condensed text: "0.5 GB", "100k", "?", "No limit". */
  big: string;
  /** Small text under or beside it: "requests a day", "Not listed". */
  sub: string | null;
  known: boolean;
}

/**
 * The big number and the words under it, from the aisle's label and unit.
 * "transfer" + "GB a month" gives "100 GB" over "transfer a month";
 * "monthly users" + "users a month" gives "50k" over "monthly users", not "users users".
 */
export function metricParts(n: string, aisle: Aisle): { big: string; sub: string | null } {
  const [first = "", ...rest] = aisle.unit.split(" ");
  if (INLINE_UNITS.has(first)) return { big: `${n} ${first}`.trim(), sub: rest.length ? [aisle.label, ...rest].join(" ") : null };
  if (first && aisle.label.split(" ").includes(first)) return { big: n, sub: aisle.label };
  return { big: n, sub: [aisle.label, aisle.unit].filter(Boolean).join(" ") || null };
}

export function headline(tool: Tool, aisle: Aisle): HeadlineParts {
  if (tool.source === "imported") return { big: "?", sub: null, known: false };
  if (tool.program) return { big: tool.program.lasts_big, sub: tool.program.lasts_sub, known: true };
  if (isUnlimited(tool)) return { big: "No limit", sub: tool.metric_note ?? null, known: true };
  if (tool.metric === null) return { big: "?", sub: "Not listed", known: false };
  const n = compactNumber(tool.metric);
  const { big, sub } = metricParts(n, aisle);
  return { big, sub: sub ?? tool.metric_note ?? null, known: true };
}

export function strings(tool: Tool, now: Date) {
  const state = labelState(tool, now);
  const days = tool.verified_at ? daysSince(tool.verified_at, now) : null;
  const by = tool.verified_by ? ` by ${tool.verified_by}` : "";
  const when = days === null ? "" : days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  switch (state) {
    case "checked":
      return { state, text: `Checked ${when}${by}`, link: null };
    case "overdue":
      return { state, text: `Checked ${shortDate(tool.verified_at!)}. Due for a recheck`, link: "Recheck it" };
    case "unchecked":
      return { state, text: "Not checked yet", link: "Check it" };
    case "review":
      return { state, text: "A change is waiting for review", link: null };
    case "vendor-changed":
      return {
        state,
        text: `${tool.name} changed its pricing page on ${shortDate(tool.vendor_changed_at!)}`,
        link: "Recheck this label",
      };
    case "imported":
      return { state, text: `From ${tool.imported_from ?? "an awesome list"}. No numbers yet`, link: "Write its label" };
  }
}

/** Sort for the aisle grid: Suggested, then checked, then the rest, each by metric (biggest first). */
export function sortForAisle(tools: Tool[], now: Date): Tool[] {
  const rank = (t: Tool) => (isSuggested(t, now) ? 0 : labelState(t, now) === "checked" ? 1 : 2);
  return [...tools].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    const am = isUnlimited(a) ? Infinity : (a.metric ?? -1);
    const bm = isUnlimited(b) ? Infinity : (b.metric ?? -1);
    if (bm !== am) return bm - am;
    return a.name.localeCompare(b.name);
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
