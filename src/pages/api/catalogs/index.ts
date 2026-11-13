import type { APIRoute } from "astro";
import { GENERATED_AT, catalogsMeta } from "../../../lib/catalog";
import { snapshot } from "../../../lib/fresh/catalog";
import { json, options } from "../../../lib/http";

export const prerender = false;

export const OPTIONS: APIRoute = () => options();

/** The old catalogs (saas, apis, llm-ai) as aliases for the aisle groups, plus the aisles themselves. */
export const GET: APIRoute = () => {
  const snap = snapshot();
  return json({
    ok: true,
    generatedAt: GENERATED_AT,
    catalogs: catalogsMeta(),
    aisles: snap.aisles.map((a) => ({
      id: a.id,
      group: a.group,
      name: a.name,
      metric: a.metric,
      unit: a.unit,
      label: a.label,
      count: snap.tools.filter((t) => t.aisle === a.id).length,
    })),
    lists: snap.lists,
  });
};
