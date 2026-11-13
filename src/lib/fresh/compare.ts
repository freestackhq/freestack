/**
 * Compare page logic (Compare.dc.html, PhoneCompare.dc.html). Pure functions:
 * the page passes in tools it got from catalog.ts.
 */
import { headline, strings } from "./label";
import type { Aisle, Tool } from "./types";

export const MAX_COMPARE = 4;

/** "neon, Turso,,neon" -> ["neon", "turso"] */
export function parseIds(raw: string | null | undefined): string[] {
  const out: string[] = [];
  for (const part of (raw ?? "").split(",")) {
    const id = part.trim().toLowerCase();
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

export function compareHref(ids: string[], opts: { only?: boolean } = {}): string {
  const q: string[] = [];
  if (ids.length) q.push(`ids=${ids.map(encodeURIComponent).join(",")}`);
  if (opts.only) q.push("only=differs");
  return q.length ? `/compare?${q.join("&")}` : "/compare";
}

export function withAdded(ids: string[], id: string): string[] {
  if (!id || ids.includes(id) || ids.length >= MAX_COMPARE) return ids;
  return [...ids, id];
}

export function withRemoved(ids: string[], id: string): string[] {
  return ids.filter((x) => x !== id);
}

/** Put `id` in column `col` (0-based). If it is already in another column, the two trade places. */
export function withSwapped(ids: string[], col: number, id: string): string[] {
  if (!id || col < 0 || col >= ids.length) return ids;
  const next = [...ids];
  const j = next.indexOf(id);
  if (j !== -1 && j !== col) next[j] = next[col];
  next[col] = id;
  return next;
}

export interface Selection {
  tools: Tool[];
  /** Ids in the URL that are not in the catalog. */
  dropped: string[];
  /** More than MAX_COMPARE were asked for. */
  capped: boolean;
}

export function resolve(ids: string[], lookup: (id: string) => Tool | undefined): Selection {
  const found: Tool[] = [];
  const dropped: string[] = [];
  for (const id of ids) {
    const t = lookup(id);
    if (t) found.push(t);
    else dropped.push(id);
  }
  return { tools: found.slice(0, MAX_COMPARE), dropped, capped: found.length > MAX_COMPARE };
}

/** "Neon or Turso?", "Neon, Turso or Supabase?" */
export function questionFor(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]}?`;
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}?`;
}

/** "a", "a and b", "a, b and c" */
export function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * The aisle most picks belong to (ties go to the first pick), and the
 * picks from other aisles.
 */
export function aisleSplit(tools: Tool[]): { main: string; others: Tool[] } {
  const counts = new Map<string, number>();
  for (const t of tools) counts.set(t.aisle, (counts.get(t.aisle) ?? 0) + 1);
  let main = tools[0]?.aisle ?? "";
  for (const [a, n] of counts) if (n > (counts.get(main) ?? 0)) main = a;
  return { main, others: tools.filter((t) => t.aisle !== main) };
}

export type Flag = "yes" | "no" | "unknown";

export type Cell =
  | { kind: "text"; lines: string[]; muted: boolean; big?: boolean }
  | { kind: "flag"; value: Flag };

export interface Row {
  label: string;
  cells: Cell[];
  /** Values are not all the same. */
  diff: boolean;
  /** Never marked as differing ("Pick it if"). */
  noDiff?: boolean;
  /** Shown in the column header on desktop, as a row on phone. */
  headline?: boolean;
}

const text = (lines: string[], muted = false): Cell => ({ kind: "text", lines, muted });

function cellKey(c: Cell): string {
  return c.kind === "flag" ? `f:${c.value}` : `t:${c.lines.join("|")}`;
}

/** True when the cell says "Unknown" or shows an unknown number. */
export function isUnknownCell(c: Cell): boolean {
  return c.kind === "flag" ? c.value === "unknown" : c.lines.length === 1 && (c.lines[0] === "Unknown" || c.lines[0] === "?");
}

function whoCell(t: Tool): Cell {
  if (t.who.includes("anyone")) return { kind: "flag", value: "yes" };
  if (t.who.includes("student_any_id")) return text(["Students only"]);
  if (t.who.includes("student_school_email")) return text(["School email only"]);
  if (t.who.includes("startup_proof")) return text(["Startups only"]);
  return { kind: "flag", value: "unknown" };
}

function cardCell(t: Tool): Cell {
  if (t.card === "no") return text(["Not needed"]);
  if (t.card === "yes") return text(["Needed at signup"]);
  return text(["Unknown"], true);
}

/** Headline cell: big number plus its unit line. */
export function headlineCell(t: Tool, aisle: Aisle): { big: string; sub: string | null; known: boolean } {
  const h = headline(t, aisle);
  if (t.source === "imported") return { big: "?", sub: "No numbers yet", known: false };
  if (!h.known) return { big: "?", sub: "Not listed", known: false };
  return h;
}

export function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function rows(tools: Tool[], aisle: Aisle, now: Date): Row[] {
  const list: { label: string; cell: (t: Tool) => Cell; noDiff?: boolean; headline?: boolean }[] = [
    {
      label: capitalize(aisle.label),
      headline: true,
      cell: (t) => {
        const h = headlineCell(t, aisle);
        return { kind: "text", lines: [h.sub ? `${h.big} ${h.sub}` : h.big], muted: !h.known, big: true };
      },
    },
    { label: "Also capped", cell: (t) => (t.limits.length ? text(t.limits) : text(["None listed"], true)) },
    { label: "The catch", cell: (t) => (t.catches.length ? text(t.catches) : text(["None listed"], true)) },
    { label: "Open to all", cell: whoCell },
    { label: "Can sell", cell: (t) => ({ kind: "flag", value: t.sell }) },
    { label: "Credit card", cell: cardCell },
    {
      label: "Checked",
      cell: (t) => {
        const s = strings(t, now);
        return text([s.text], s.state === "unchecked" || s.state === "imported");
      },
    },
    { label: "Pick it if", noDiff: true, cell: (t) => (t.use_if[0] ? text([t.use_if[0]]) : text(["Not written yet"], true)) },
  ];
  return list.map((d) => {
    const cells = tools.map(d.cell);
    const keys = cells.map(cellKey);
    const diff = !d.noDiff && keys.some((k) => k !== keys[0]);
    return { label: d.label, cells, diff, noDiff: d.noDiff, headline: d.headline };
  });
}
