import type { APIRoute } from "astro";
import { CATALOGS } from "../lib/catalog";

export const prerender = true;

export const GET: APIRoute = () => {
  const lines: string[] = [
    "# Freestack",
    "",
    "> A decision catalog for free and low-cost developer tools, public APIs, and AI services.",
    "",
    "Freestack helps founders launch an MVP, students publish project demos, and hobbyists choose between managed and self-hosted tools. It surfaces limits, eligibility, commercial terms, and alternatives.",
    "",
    "Results are filtered catalog entries, not rankings or personalized recommendations. Provider terms change; verify important details with the provider before relying on an offer.",
    "",
    "## Audience guides",
    "",
    "- [Launch a lean MVP](https://freestack.kuyacarlo.dev/guides/startup): Compare commercial terms and operating constraints before launch.",
    "- [Publish a portfolio project](https://freestack.kuyacarlo.dev/guides/portfolio): Choose a demo deployment and make the project easy to review.",
    "- [Build for yourself](https://freestack.kuyacarlo.dev/guides/hobby): Weigh managed convenience against self-hosting upkeep.",
    "- [Student offers](https://freestack.kuyacarlo.dev/guides/claim-order): Review eligibility and time-sensitive offers.",
    "- [Starter stacks](https://freestack.kuyacarlo.dev/guides/stacks): See editable stack examples; they are not personalized recommendations.",
    "",
    "## Catalogs",
    "",
  ];

  for (const catalog of CATALOGS) {
    const total = catalog.categories.reduce((count, category) => count + category.entries.length, 0);
    lines.push(`- [${catalog.label}](https://freestack.kuyacarlo.dev/catalogs/${catalog.id}): ${catalog.description} (${total} entries across ${catalog.categories.length} categories)`);
  }

  lines.push(
    "",
    "## Data and API",
    "",
    "- [Directory](https://freestack.kuyacarlo.dev/catalogs): Search and filter all catalogs.",
    "- [Catalog API](https://freestack.kuyacarlo.dev/api/catalogs): Catalogs, categories, and entry counts.",
    "- [Entries API](https://freestack.kuyacarlo.dev/api/entries): Search and filter catalog entries.",
    "- [OpenAPI](https://freestack.kuyacarlo.dev/api/openapi.json): API schema.",
    "- [Full catalog text](https://freestack.kuyacarlo.dev/llms-full.txt): Plain-text snapshot for language models.",
    "- [API reference](https://freestack.kuyacarlo.dev/docs): Interactive API documentation.",
    "",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
