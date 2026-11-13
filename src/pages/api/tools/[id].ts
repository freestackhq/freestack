import type { APIRoute } from "astro";
import { cliTool, findTool } from "../../../lib/catalog";
import { json, options } from "../../../lib/http";

export const prerender = false;

export const OPTIONS: APIRoute = () => options();

/** One tool for the published CLI (`freestack tool <id>`). */
export const GET: APIRoute = ({ params }) => {
  const t = findTool(params.id ?? "");
  if (!t) return json({ ok: false, error: `No tool with id ${params.id}` }, { status: 404 });
  return json({ ok: true, tool: cliTool(t) });
};
