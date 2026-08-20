import type { APIRoute } from "astro";
import { CATALOGS, allEntries } from "../../lib/catalog";
import { json, options } from "../../lib/http";

export const prerender = false;

export const OPTIONS: APIRoute = () => options();

export const GET: APIRoute = () =>
  json({
    ok: true,
    service: "freestack",
    version: "0.2.0",
    catalogs: CATALOGS.length,
    entries: allEntries().length,
    endpoints: {
      catalogs: "GET /api/catalogs",
      entries: "GET /api/entries?catalog=selfhosted&category=monitoring&q=uptime&limit=20",
      health: "GET /api/health",
      openapi: "GET /api/openapi.json",
    },
    site: "https://freestack.kuyacarlo.dev",
  });
