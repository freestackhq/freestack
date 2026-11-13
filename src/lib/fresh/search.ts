/**
 * Search over a small in-page index. Pure and client-safe: no catalog import.
 *
 * The index is built at render time by search-index.ts and embedded in the
 * page as JSON. Pagefind is the planned replacement: the SearchDialog calls
 * one function (`findResults` in its script), which is the only thing to swap.
 */

export type SearchGroup = "catches" | "tools" | "aisles";

export const GROUP_ORDER: SearchGroup[] = ["catches", "tools", "aisles"];
export const GROUP_LABEL: Record<SearchGroup, string> = { catches: "Catches", tools: "Tools", aisles: "Aisles" };

/** Max rows shown per group. */
const LIMIT: Record<SearchGroup, number> = { catches: 4, tools: 6, aisles: 4 };

export interface SearchEntry {
  group: SearchGroup;
  title: string;
  sub: string;
  href: string;
  /** Extra words to match on (kind, limits, catches). Not shown. */
  terms: string;
  /** Tools only: selling status for the right-hand fact. */
  sell?: "yes" | "no" | "unknown";
  /** Catch pages only: shows "Read" on the right. */
  read?: boolean;
}

export interface SearchResultGroup {
  group: SearchGroup;
  label: string;
  items: SearchEntry[];
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim();
}

function words(s: string): string[] {
  return norm(s).split(" ").filter(Boolean);
}

function score(e: SearchEntry, q: string, qWords: string[]): number {
  const title = norm(e.title);
  const hay = `${title} ${norm(e.sub)} ${norm(e.terms)}`;
  if (!qWords.every((w) => hay.includes(w))) return -1;
  if (title === q) return 0;
  if (title.startsWith(q)) return 1;
  if (qWords.every((w) => title.includes(w))) return 2;
  return 3;
}

/** Grouped matches, in group order. Groups with no match are left out. */
export function searchLocal(index: SearchEntry[], query: string): SearchResultGroup[] {
  const q = norm(query);
  if (!q) return [];
  const qWords = words(query);
  const scored = index
    .map((e, i) => ({ e, i, s: score(e, q, qWords) }))
    .filter((r) => r.s >= 0)
    .sort((a, b) => a.s - b.s || a.i - b.i);
  return GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABEL[group],
    items: scored
      .filter((r) => r.e.group === group)
      .slice(0, LIMIT[group])
      .map((r) => r.e),
  })).filter((g) => g.items.length > 0);
}

/** Levenshtein edit distance. */
export function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Closest tool or aisle name for a query that found nothing. Compares the
 * whole name and each word of it. Returns null when nothing is close.
 */
export function didYouMean(index: SearchEntry[], query: string): SearchEntry | null {
  const q = norm(query);
  if (q.length < 2) return null;
  const max = Math.max(1, Math.floor(q.length / 3));
  let best: { e: SearchEntry; d: number } | null = null;
  for (const e of index) {
    if (e.group === "catches") continue;
    const name = norm(e.title);
    const candidates = [name, name.replace(/ /g, ""), ...name.split(" ").filter((w) => w.length > 2)];
    const d = Math.min(...candidates.map((c) => distance(q, c)));
    if (d <= max && (!best || d < best.d)) best = { e, d };
  }
  return best?.e ?? null;
}
