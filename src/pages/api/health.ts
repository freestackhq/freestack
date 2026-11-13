import type { APIRoute } from "astro";
import { SITE_URL } from "../../lib/site";
import { CATALOGS, GENERATED_AT } from "../../lib/catalog";
import { snapshot } from "../../lib/fresh/catalog";
import { json, options } from "../../lib/http";

export const prerender = false;

export const OPTIONS: APIRoute = () => options();

export const GET: APIRoute = () => {
  const snap = snapshot();
  return json({
    ok: true,
    service: "freestack",
    version: "0.3.0",
    generatedAt: GENERATED_AT,
    catalogs: CATALOGS.length,
    aisles: snap.aisles.length,
    entries: snap.tools.length,
    tools: snap.tools.length,
    endpoints: {
      catalogs: "GET /api/catalogs",
      entries: "GET /api/entries?catalog=saas&category=databases&q=postgres&limit=20",
      tools: "GET /api/tools?category=databases&commercial=yes",
      tool: "GET /api/tools/<id>",
      claim: "GET /api/claim?student=1&commercial=1",
      health: "GET /api/health",
      openapi: "GET /api/openapi.json",
    },
    site: SITE_URL,
  });
};
