import type { APIRoute } from "astro";
import { CATALOGS, GENERATED_AT } from "../lib/catalog";

export const prerender = true;

export const GET: APIRoute = () => {
  const lines: string[] = [
    "# freestack — Full Catalog Digest",
    "",
    "> Plain-text snapshot of catalog entries for free and low-cost developer tools, public APIs, and AI services.",
    `Snapshot generated: ${GENERATED_AT}`,
    "",
    "Freestack helps people compare options while building an MVP, publishing a project demo, or running tools for themselves. Entries expose limits, eligibility, commercial terms, and alternatives when available.",
    "",
    "This is reference data, not a ranked or personalized recommendation. Provider terms and limits can change; confirm details with the provider before making a decision. Self-hostable tools appear where listed in the catalogs; this snapshot has no separate self-hosted catalog.",
    "",
    "Guides: https://freestack.kuyacarlo.dev/guides/startup · https://freestack.kuyacarlo.dev/guides/portfolio · https://freestack.kuyacarlo.dev/guides/hobby",
    "",
  ];

  for (const catalog of CATALOGS) {
    lines.push(`## Catalog: ${catalog.label}`, "", catalog.description, "");

    for (const cat of catalog.categories) {
      lines.push(`### Category: ${cat.label}`, "");

      for (const entry of cat.entries) {
        lines.push(`#### ${entry.name}`);
        if (entry.pick) {
          lines.push(`- **Pick this if**: ${entry.pick}`);
        }

        const fieldKeys = Object.keys(entry.fields);
        if (fieldKeys.length > 0) {
          for (const k of fieldKeys) {
            lines.push(`- **${k}**: ${entry.fields[k]}`);
          }
        }

        if (entry.prose && entry.prose.length > 0) {
          lines.push("", ...entry.prose);
        }

        if (entry.alternatives && entry.alternatives.length > 0) {
          lines.push("");
          for (const alt of entry.alternatives) {
            lines.push(`- vs ${alt.name}: ${alt.text}`);
          }
        }

        lines.push("");
      }
    }
  }

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
