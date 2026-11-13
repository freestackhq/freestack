import type { APIRoute } from "astro";
import { SITE_URL } from "../lib/site";
import { headlineText } from "../lib/catalog";
import { aislesByGroup, now, tool, tools } from "../lib/fresh/catalog";
import { strings } from "../lib/fresh/label";

export const prerender = true;

const WHO: Record<string, string> = {
  anyone: "anyone",
  student_any_id: "students (any proof)",
  student_school_email: "students with a school email",
  startup_proof: "startups that apply",
};
const YNU: Record<string, string> = { yes: "yes", no: "no", unknown: "unknown" };

/** Every label in plain text, aisle by aisle. Regenerated from the snapshot. */
export const GET: APIRoute = () => {
  const at = now();
  const all = tools();
  const lines: string[] = [
    "# freestack: every label",
    "",
    "> Free developer tools as shelf labels. Numbers are the vendor's own figures from the catalog; \"Not listed\" means we don't have one.",
    "",
  ];

  for (const { group, aisles } of aislesByGroup()) {
    if (!aisles.length) continue;
    lines.push(`## ${group}`, "");
    for (const a of aisles) {
      lines.push(`### ${a.name}`, "", `Headline: ${a.label}${a.unit ? ` (${a.unit})` : ""}. ${SITE_URL}/${a.id}`, "");
      for (const t of all.filter((x) => x.aisle === a.id)) {
        lines.push(`#### ${t.name}`, "");
        if (t.source === "imported") {
          lines.push(`- From ${t.imported_from ?? "an awesome list"}. No numbers yet.`, `- ${t.url}`, "");
          continue;
        }
        if (t.tagline) lines.push(t.tagline, "");
        lines.push(`- Kind: ${t.kind}`);
        lines.push(`- ${a.label}: ${t.program ? `${t.program.lasts_big} ${t.program.lasts_sub}` : headlineText(t, a)}`);
        for (const l of t.limits) lines.push(`- Limit: ${l}`);
        lines.push(`- Who can claim: ${t.who.map((w) => WHO[w] ?? w).join(", ")}`);
        lines.push(`- Can sell: ${YNU[t.sell]}. Card at signup: ${YNU[t.card]}.`);
        for (const c of t.catches) lines.push(`- Catch: ${c}`);
        for (const u of t.use_if) lines.push(`- Use it if: ${u}`);
        for (const s of t.skip_if) lines.push(`- Skip it if: ${s.reason}${s.use ? ` Use ${tool(s.use)?.name ?? s.use}.` : ""}`);
        lines.push(`- Label: ${strings(t, at).text}`);
        lines.push(`- ${SITE_URL}/${t.aisle}/${t.id} (vendor: ${t.url})`, "");
      }
    }
  }

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
};
