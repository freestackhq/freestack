import type { APIRoute } from "astro";
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
    lines.push(`- [${c.label}](https://freestack.kuyacarlo.dev/catalogs/${c.id}): ${c.description} (${total} entries across ${c.categories.length} categories)`);
  }

  lines.push(
    "",
    "## API Endpoints",
    "",
    "- [OpenAPI Spec](https://freestack.kuyacarlo.dev/api/openapi.json): Machine-readable OpenAPI 3.1.0 definition.",
    "- [All Entries API](https://freestack.kuyacarlo.dev/api/entries): Query entries across all catalogs with filters.",
    "- [Catalogs API](https://freestack.kuyacarlo.dev/api/catalogs): List of available catalogs, categories, and entry counts.",
    "- [Full Text Dump](https://freestack.kuyacarlo.dev/llms-full.txt): Complete Markdown dump of all entries for LLMs.",
    "",
    "## Guides",
    "",
    "- [Claim Order Guide](https://freestack.kuyacarlo.dev/guides/claim-order): Optimal claiming order for student & developer credits.",
    "- [Startup Guide](https://freestack.kuyacarlo.dev/guides/startup): Zero-cost stack architecture guide for startups.",
    "- [Stacks Guide](https://freestack.kuyacarlo.dev/guides/stacks): Recommended developer stacks with free tiers.",
    ""
  );

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
