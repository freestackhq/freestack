import type { APIRoute } from "astro";
import { SITE_URL } from "../lib/site";
import { aisleCount, aislesByGroup, totalTools } from "../lib/fresh/catalog";

export const prerender = true;

/** Index for language models: every aisle, the API, and the full dump. Regenerated from the snapshot. */
export const GET: APIRoute = () => {
  const lines: string[] = [
    "# freestack",
    "",
    `> ${totalTools()} free developer tools, student and startup programs, and free APIs, shown as shelf labels: the one limit that matters, who can claim it, whether you can sell with it, whether signup asks for a card, the catch, and when someone last checked it. Unknown means unknown.`,
    "",
  ];

  for (const { group, aisles } of aislesByGroup()) {
    if (!aisles.length) continue;
    lines.push(`## ${group}`, "");
    for (const a of aisles) {
      lines.push(`- [${a.name}](${SITE_URL}/${a.id}): ${aisleCount(a.id)} labels. Headline: ${a.label}${a.unit ? ` (${a.unit})` : ""}.`);
    }
    lines.push("");
  }

  lines.push(
    "## API",
    "",
    `- [OpenAPI spec](${SITE_URL}/api/openapi.json): machine-readable OpenAPI 3.1 definition.`,
    `- [Entries](${SITE_URL}/api/entries): every tool with its label fields. Filter with ?aisle=, ?group=, ?q=. The old ?catalog=saas|apis|llm-ai still works.`,
    `- [Catalogs and aisles](${SITE_URL}/api/catalogs): aisle list with counts.`,
    `- [Full text](${SITE_URL}/llms-full.txt): every label in plain text.`,
    "",
    "## Pages",
    "",
    `- [Build a stack](${SITE_URL}/build): pick parts and see what clashes.`,
    `- [Check my stack](${SITE_URL}/check): paste the tools you use.`,
    `- [Startup guide](${SITE_URL}/guides/startup): a zero-cost stack for a new company.`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
};
