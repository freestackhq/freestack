/**
 * The pick-free-stack skill with this site's address filled in, generated at
 * build time from skills/pick-free-stack/SKILL.md and SITE_URL.
 */
import type { APIRoute } from "astro";
import source from "../../../../skills/pick-free-stack/SKILL.md?raw";
import { fillSkill } from "../../../../scripts/skill-fill.mjs";
import { SITE_URL } from "../../../lib/site";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(fillSkill(source, SITE_URL), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Access-Control-Allow-Origin": "*" },
  });
