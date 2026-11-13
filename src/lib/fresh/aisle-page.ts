/**
 * Pure logic for the aisle page: URL state, filters, no-match offers,
 * compare tray copy. Shared by the server render and the page script,
 * so it must not import the data module.
 */

export const MAX_COMPARE = 4;

/** The shape a label exposes to filters (its data-* attributes). */
export interface FilterItem {
  type?: string | null;
  sell: string;
  card: string;
  who: string[];
}

export interface Filters {
  type: string | null;
  must: string[];
}

export interface PageState extends Filters {
  compare: string[];
}

export interface Must {
  id: string;
  /** Desktop chip ("Must allow" group). */
  chip: string;
  /** Phone sheet switch. */
  sheet: string;
  /** Inside "Drop ..." on the no-match panel. */
  short: string;
  /** Lowercase phrase for the no-match sentence. */
  phrase: string;
  test: (i: FilterItem) => boolean;
}

/** "Must allow" filters. Unknown never counts as a match. */
export const MUST: Must[] = [
  {
    id: "sell",
    chip: "OK to sell",
    sheet: "Selling with it",
    short: "Can sell",
    phrase: "can sell",
    test: (i) => i.sell === "yes",
  },
  {
    id: "no-card",
    chip: "No credit card",
    sheet: "No credit card",
    short: "No card",
    phrase: "no credit card",
    test: (i) => i.card === "no",
  },
  {
    id: "no-school-email",
    chip: "No school email",
    sheet: "No school email needed",
    short: "No school email",
    phrase: "no school email",
    test: (i) => i.who.some((w) => w !== "student_school_email"),
  },
];

const MUST_IDS = MUST.map((m) => m.id);

function list(v: string | null): string[] {
  return (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Read the page state from a query string. Unknown values are dropped. */
export function parseState(search: string, types: string[], ids: string[]): PageState {
  const q = new URLSearchParams(search);
  const type = q.get("type");
  const must = MUST_IDS.filter((id) => list(q.get("must")).includes(id));
  const compare = [...new Set(list(q.get("compare")).filter((id) => ids.includes(id)))].slice(0, MAX_COMPARE);
  return { type: type && types.includes(type) ? type : null, must, compare };
}

/** Write the page state as a query string ("" when there is nothing to say). */
export function toSearch(s: PageState): string {
  const parts: string[] = [];
  if (s.type) parts.push(`type=${encodeURIComponent(s.type)}`);
  const must = MUST_IDS.filter((id) => s.must.includes(id));
  if (must.length) parts.push(`must=${must.join(",")}`);
  if (s.compare.length) parts.push(`compare=${s.compare.map(encodeURIComponent).join(",")}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

export function matches(i: FilterItem, f: Filters): boolean {
  if (f.type && i.type !== f.type) return false;
  return f.must.every((id) => MUST.find((m) => m.id === id)?.test(i) ?? true);
}

export function activeCount(f: Filters): number {
  return (f.type ? 1 : 0) + f.must.length;
}

export interface DropOffer {
  /** "type" or a Must id. */
  key: string;
  label: string;
  count: number;
}

/** What each single filter would give if dropped, most matches first. */
export function dropOffers(items: FilterItem[], f: Filters, typeLabels: Record<string, string>): DropOffer[] {
  const offers: DropOffer[] = [];
  if (f.type) {
    const g = { ...f, type: null };
    offers.push({ key: "type", label: typeLabels[f.type] ?? f.type, count: items.filter((i) => matches(i, g)).length });
  }
  for (const id of f.must) {
    const g = { ...f, must: f.must.filter((m) => m !== id) };
    const m = MUST.find((x) => x.id === id)!;
    offers.push({ key: id, label: m.short, count: items.filter((i) => matches(i, g)).length });
  }
  return offers.sort((a, b) => b.count - a.count);
}

/** "Postgres, can sell and no credit card." */
export function describeFilters(f: Filters, typeLabels: Record<string, string>): string {
  const bits: string[] = [];
  if (f.type) bits.push(typeLabels[f.type] ?? f.type);
  for (const id of MUST_IDS) if (f.must.includes(id)) bits.push(MUST.find((m) => m.id === id)!.phrase);
  if (!bits.length) return "";
  const text = bits.length === 1 ? bits[0] : `${bits.slice(0, -1).join(", ")} and ${bits[bits.length - 1]}`;
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

/** Singular of an aisle noun. Compound nouns ("caches and queues") fall back to "tool". */
export function one(noun: string): string {
  if (/ and /.test(noun) || !/s$/.test(noun)) return "tool";
  return noun.replace(/s$/, "");
}

export function noMatchTitle(noun: string, active: number): string {
  const who = / and /.test(noun) ? "Nothing" : `No ${one(noun)}`;
  return active === 1 ? `${who} fits this filter` : `${who} fits all ${active} filters`;
}

/** "8 free databases, by free storage." */
export function countLine(n: number, noun: string, metricLabel: string): string {
  if (n === 0) return "No labels here yet.";
  return `${n} free ${n === 1 ? one(noun) : noun}, by ${metricLabel}.`;
}

export function labelsText(n: number): string {
  return n === 1 ? "1 label" : `${n} labels`;
}

export function trayHint(count: number, warn: boolean): string {
  if (warn) return `You can compare ${MAX_COMPARE} at a time. Remove one to add another.`;
  return count < 2 ? "Add one more to compare" : "";
}

export function compareHref(ids: string[]): string {
  return `/compare?ids=${ids.map(encodeURIComponent).join(",")}`;
}

export interface CrossAisle {
  /** The other aisle (first one found in the tray). */
  aisle: string;
  names: string[];
  ids: string[];
  /** Picks that belong to this aisle. */
  own: string[];
}

/** Tray picks from another aisle, or null when every pick fits this aisle. */
export function crossAisle(
  compare: string[],
  aisleId: string,
  index: Record<string, { name: string; aisle: string }>,
): CrossAisle | null {
  const own = compare.filter((id) => index[id]?.aisle === aisleId);
  const first = compare.find((id) => index[id] && index[id].aisle !== aisleId);
  if (!first) return null;
  const other = index[first].aisle;
  const ids = compare.filter((id) => index[id]?.aisle === other);
  return { aisle: other, names: ids.map((id) => index[id].name), ids, own };
}

/** "Vercel Hobby", "Vercel Hobby and Koyeb", "A, B and C" */
export function andList(items: string[]): string {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
