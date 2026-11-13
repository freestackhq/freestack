/**
 * Builds the in-page search index from catalog.ts at render time.
 * Server only. Pagefind replaces this at deploy (ARCHITECTURE.md "Pages").
 */
import { aisle as getAisle, aisleCount, aisles, catches, toolHref, tools } from "./catalog";
import { headline } from "./label";
import type { SearchEntry } from "./search";

function lcFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export function buildSearchIndex(): SearchEntry[] {
  const all = tools();
  const out: SearchEntry[] = [];

  // Catch pages first, then each tool's own catch line.
  for (const c of catches()) {
    const t = all.find((x) => x.id === c.tool);
    out.push({
      group: "catches",
      title: c.question,
      sub: `${c.answer} ${c.detail}`,
      href: `/catches/${c.slug}`,
      terms: [t?.name, ...c.includes].filter(Boolean).join(" "),
      read: true,
    });
  }
  for (const t of all) {
    if (t.source === "imported") continue;
    const a = getAisle(t.aisle);
    for (const line of t.catches) {
      out.push({
        group: "catches",
        title: `${t.name} ${lcFirst(line)}`,
        sub: t.catch_detail?.[0] ?? `${a?.name ?? t.aisle}. ${t.kind}`,
        href: toolHref(t),
        terms: `${t.kind} ${a?.name ?? ""}`,
      });
    }
  }

  for (const t of all) {
    const a = getAisle(t.aisle);
    let sub: string;
    if (t.source === "imported") {
      sub = `${a?.name ?? t.aisle}. From ${t.imported_from ?? "an awesome list"}. No numbers yet`;
    } else if (a) {
      const h = headline(t, a);
      sub = `${a.name}. ${h.known ? [h.big, h.sub].filter(Boolean).join(" ") : "Not listed"}`;
    } else {
      sub = t.kind;
    }
    out.push({
      group: "tools",
      title: t.name,
      sub,
      href: toolHref(t),
      terms: [t.kind, t.id, ...t.limits, ...t.catches].join(" "),
      sell: t.source === "imported" ? undefined : t.sell,
    });
  }

  for (const a of aisles()) {
    const n = aisleCount(a.id);
    out.push({
      group: "aisles",
      title: a.name,
      sub: n === 0 ? "No labels yet" : n === 1 ? "1 label" : `${n} labels`,
      href: `/${a.id}`,
      terms: `${a.group} ${a.label} ${a.noun ?? ""}`,
    });
  }
  return out;
}
