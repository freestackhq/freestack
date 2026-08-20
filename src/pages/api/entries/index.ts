import type { APIRoute } from "astro";
import { CATALOGS, GENERATED_AT, queryEntries } from "../../../lib/catalog";
import { json, options } from "../../../lib/http";

export const prerender = false;

export const OPTIONS: APIRoute = () => options();

export const GET: APIRoute = ({ url }) => {
  if (url.searchParams.get("meta") === "1") {
    return json({
      ok: true,
      generatedAt: GENERATED_AT,
      catalogs: CATALOGS.map((c) => ({
        id: c.id,
        label: c.label,
        description: c.description,
        repo: `${c.owner}/${c.repo}`,
        categories: c.categories.map((cat) => ({ id: cat.id, label: cat.label })),
        count: c.categories.reduce((n, cat) => n + cat.entries.length, 0),
      })),
    });
  }
  const q = url.searchParams.get("q") ?? undefined;
  const catalog = url.searchParams.get("catalog") ?? undefined;
  const category = url.searchParams.get("category") ?? undefined;
  const limitRaw = url.searchParams.get("limit");
  const filters: Record<string, string[]> = {};
  for (const [k, v] of url.searchParams) {
    if (["q", "catalog", "category", "limit", "meta"].includes(k)) continue;
    filters[k] = v.split(",").filter(Boolean);
  }
  const result = queryEntries({
    q,
    catalog,
    category,
    filters,
    limit: limitRaw ? Number(limitRaw) : undefined,
  });
  return json({ ok: true, ...result, query: { q, catalog, category, filters } });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json({ ok: false, error: "JSON body expected" }, { status: 400 });
  }
  const { q, catalog, category, filters, limit } = body as {
    q?: string;
    catalog?: string;
    category?: string;
    filters?: Record<string, string[]>;
    limit?: number;
  };
  const result = queryEntries({ q, catalog, category, filters, limit });
  return json({ ok: true, ...result, query: { q, catalog, category, filters } });
};