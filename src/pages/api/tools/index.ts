import type { APIRoute } from "astro";
import { GENERATED_AT, queryTools } from "../../../lib/catalog";
import { json, options } from "../../../lib/http";

export const prerender = false;

export const OPTIONS: APIRoute = () => options();

/** Flat tool list for the published CLI (`freestack tools`). */
export const GET: APIRoute = ({ url }) =>
  json({ ok: true, generatedAt: GENERATED_AT, ...queryTools(url.searchParams) });
