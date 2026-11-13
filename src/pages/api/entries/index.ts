import type { APIRoute } from "astro";
import { GENERATED_AT, catalogsMeta, queryEntries, type EntryQuery } from "../../../lib/catalog";
import { json, options } from "../../../lib/http";

export const prerender = false;

export const OPTIONS: APIRoute = () => options();

const RESERVED = ["q", "catalog", "category", "aisle", "group", "limit", "meta"];

export const GET: APIRoute = ({ url }) => {
  if (url.searchParams.get("meta") === "1") {
    return json({ ok: true, generatedAt: GENERATED_AT, catalogs: catalogsMeta() });
  }
  const p = url.searchParams;
  const filters: Record<string, string[]> = {};
  for (const [k, v] of p) {
    if (RESERVED.includes(k)) continue;
    filters[k] = v.split(",").filter(Boolean);
  }
  const query: EntryQuery = {
    q: p.get("q") ?? undefined,
    catalog: p.get("catalog") ?? undefined,
    category: p.get("category") ?? undefined,
    aisle: p.get("aisle") ?? undefined,
    group: p.get("group") ?? undefined,
    filters,
    limit: p.get("limit") ? Number(p.get("limit")) : undefined,
  };
  return json({ ok: true, generatedAt: GENERATED_AT, ...queryEntries(query), query });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json({ ok: false, error: "JSON body expected" }, { status: 400 });
  }
  const { q, catalog, category, aisle, group, filters, limit } = body as EntryQuery;
  const query = { q, catalog, category, aisle, group, filters, limit };
  return json({ ok: true, generatedAt: GENERATED_AT, ...queryEntries(query), query });
};
