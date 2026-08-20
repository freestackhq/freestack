import type { APIRoute } from "astro";
import { CATALOGS, GENERATED_AT } from "../../../lib/catalog";
import { json, options } from "../../../lib/http";

export const prerender = false;

export const OPTIONS: APIRoute = () => options();

export const GET: APIRoute = () =>
  json({
    ok: true,
    generatedAt: GENERATED_AT,
    catalogs: CATALOGS.map((c) => ({
      id: c.id,
      label: c.label,
      description: c.description,
      repo: `${c.owner}/${c.repo}`,
      branch: c.branch,
      categories: c.categories.map((cat) => ({
        id: cat.id,
        label: cat.label,
        count: cat.entries.length,
      })),
      count: c.categories.reduce((n, cat) => n + cat.entries.length, 0),
    })),
  });