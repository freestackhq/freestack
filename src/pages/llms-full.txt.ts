import type { APIRoute } from "astro";
import { CATALOGS } from "../lib/catalog";

export const prerender = true;

export const GET: APIRoute = () => {
  const lines: string[] = [
    "# freestack — Full Catalog Digest",
    "",
    "> Complete plain-text directory of free developer tools, APIs, and self-hosted software.",
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
