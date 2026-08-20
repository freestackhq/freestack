import snapshot from "../data/catalog.generated.json" with { type: "json" };

export const CATALOGS = snapshot.catalogs;
export const GENERATED_AT = snapshot.generatedAt;

export type Entry = (typeof CATALOGS)[number]["categories"][number]["entries"][number];
export type Category = (typeof CATALOGS)[number]["categories"][number];
export type Catalog = (typeof CATALOGS)[number];

export function getCatalog(id: string): Catalog | null {
  return CATALOGS.find((c) => c.id === id) ?? null;
}

export function getEntry(
  catalogId: string,
  categoryId: string,
  entrySlug: string,
): Entry | null {
  const cat = getCatalog(catalogId)?.categories.find((c) => c.id === categoryId);
  return cat?.entries.find((e) => e.slug === entrySlug) ?? null;
}

/** Global stable id for an entry: `catalog/category/slug`. */
export function entryId(catalog: string, category: string, slug: string) {
  return `${catalog}/${category}/${slug}`;
}

/** All entries flattened with their catalog + category context. */
export function allEntries(): { catalog: Catalog; category: Category; entry: Entry }[] {
  return CATALOGS.flatMap((c) =>
    c.categories.flatMap((cat) =>
      cat.entries.map((entry) => ({ catalog: c, category: cat, entry })),
    ),
  );
}

/** Distinct filter option values for a catalog filter, derived from its entries. */
export function filterOptions(
  catalog: Catalog,
  key: string,
  kind: "single" | "multiselect" = "multiselect",
): string[] {
  const values = new Set<string>();
  for (const cat of catalog.categories) {
    for (const e of cat.entries) {
      const raw = e.fields[key] ?? e.fields[key.toLowerCase()];
      if (!raw) continue;
      if (kind === "single") {
        values.add(raw.trim());
      } else {
        for (const part of raw.split(",")) {
          const v = part.trim();
          if (v && !/^(n\/a|na|-)$/i.test(v)) values.add(v);
        }
      }
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

export type EntryQuery = {
  q?: string;
  catalog?: string;
  category?: string;
  filters?: Record<string, string[]>;
  limit?: number;
};

function matchesFilters(entry: Entry, filters: Record<string, string[]>): boolean {
  for (const [key, wanted] of Object.entries(filters)) {
    if (!wanted.length) continue;
    const raw = (entry.fields[key] ?? entry.fields[key.toLowerCase()] ?? "").toLowerCase();
    const tokens = raw.split(",").map((t) => t.trim());
    if (!wanted.some((w) => tokens.includes(w.toLowerCase()))) return false;
  }
  return true;
}

export function queryEntries(query: EntryQuery) {
  let rows = allEntries();

  if (query.catalog) {
    rows = rows.filter((r) => r.catalog.id === query.catalog);
  }
  if (query.category) {
    rows = rows.filter((r) => r.category.id === query.category);
  }
  if (query.filters) {
    rows = rows.filter((r) => matchesFilters(r.entry, query.filters));
  }
  if (query.q) {
    const q = query.q.toLowerCase();
    rows = rows.filter((r) => {
      const { entry, category, catalog } = r;
      const hay = [
        entry.name,
        entry.fields.URL ?? "",
        ...entry.prose,
        ...Object.values(entry.fields),
      ]
        .join(" ")
        .toLowerCase();
      return (
        hay.includes(q) ||
        category.label.toLowerCase().includes(q) ||
        catalog.label.toLowerCase().includes(q)
      );
    });
  }

  const count = rows.length;
  if (query.limit && query.limit > 0) rows = rows.slice(0, query.limit);

  return {
    count,
    entries: rows.map(({ catalog, category, entry }) => ({
      id: entryId(catalog.id, category.id, entry.slug),
      catalog: catalog.id,
      category: category.id,
      categoryLabel: category.label,
      name: entry.name,
      url: entry.fields.URL ?? "",
      fields: entry.fields,
      pick: entry.pick,
      prose: entry.prose,
      alternatives: entry.alternatives,
    })),
  };
}

export function queryCategories(catalogId: string) {
  const catalog = getCatalog(catalogId);
  if (!catalog) return [];
  return catalog.categories.map((cat) => ({
    ...cat,
    entryCount: cat.entries.length,
  }));
}

export { slugify } from "./catalog/parse.mjs";