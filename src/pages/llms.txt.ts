import type { APIRoute } from "astro";
import { SITE_URL } from "../lib/site";
import { CATALOGS } from "../lib/catalog";

export const prerender = true;

export const GET: APIRoute = () => {
  const lines: string[] = [
    "# freestack",
    "",
    "> Directory of free developer tools, student unlocks, free APIs, and self-hosted software — with hard limits, eligibility, and commercial notes.",
    "",
    "## Catalogs",
    "",
  ];

  for (const c of CATALOGS) {
    const total = c.categories.reduce((n, cat) => n + cat.entries.length, 0);
    lines.push(`- [${c.label}](${SITE_URL}/catalogs/${c.id}): ${c.description} (${total} entries across ${c.categories.length} categories)`);
  }

  lines.push(
    "",
    "## API Endpoints",
    "",
    `- [OpenAPI Spec](${SITE_URL}/api/openapi.json): Machine-readable OpenAPI 3.1.0 definition.`,
    `- [All Entries API](${SITE_URL}/api/entries): Query entries across all catalogs with filters.`,
    `- [Catalogs API](${SITE_URL}/api/catalogs): List of available catalogs, categories, and entry counts.`,
    `- [Full Text Dump](${SITE_URL}/llms-full.txt): Complete Markdown dump of all entries for LLMs.`,
    "",
    "## Guides",
    "",
    `- [Claim Order Guide](${SITE_URL}/guides/claim-order): Optimal claiming order for student & developer credits.`,
    `- [Startup Guide](${SITE_URL}/guides/startup): Zero-cost stack architecture guide for startups.`,
    `- [Stacks Guide](${SITE_URL}/guides/stacks): Recommended developer stacks with free tiers.`,
    ""
  );

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
