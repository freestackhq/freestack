#!/usr/bin/env node
/**
 * Convert src/data/tools.ts into the freestack markdown catalog format
 * (the same shape freestackhq/selfhosted uses), one file per category.
 * Output: tmp/free-tools-md/  — push these to freestackhq/free-tools.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { slugify } from "../src/lib/catalog/parse.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { tools, CATEGORIES } = await import(pathToFileURL(join(root, "src/data/tools.ts")).href);

const outDir = join(root, "tmp", "free-tools-md");
mkdirSync(outDir, { recursive: true });

const cost = {
  free: "free forever",
  credits: "credits",
  student_free: "student free",
  discount: "discount",
};
const student = {
  no: "anyone",
  required: "student required",
  helps: "student helps",
};
const commercial = {
  yes: "commercial ok",
  hobby: "hobby only",
  edu: "edu only",
  check: "check ToS",
};

const catDesc = {
  databases: "Database platforms and data stores.",
  hosting: "Hosting, runtimes, and deployment platforms.",
  auth: "Auth, identity, and secrets management.",
  email: "Email and form infrastructure.",
  storage: "Object storage, buckets, and media.",
  jobs: "Job queues, schedulers, and workflow automation.",
  observability: "Logs, metrics, tracing, and error tracking.",
  security: "Security scanning, secret detection, and compliance.",
  search: "Search, vector search, and data pipelines.",
  ai: "AI models, inference, and LLM tooling.",
  startup: "Startup-lean credits and programs.",
  student: "Student-only unlocks and education licenses.",
  design: "Design, UI, and CAD tools.",
  cloud: "Cloud credit programs.",
  learning: "Learning platforms and docs.",
  ph: "Philippines-specific and campus tools.",
  niche: "Niche gems worth knowing.",
};

let total = 0;
for (let i = 0; i < CATEGORIES.length; i++) {
  const cat = CATEGORIES[i];
  const items = tools.filter((t) => t.category === cat.id);
  if (!items.length) continue;

  const file = `${cat.id}.md`;
  const lines = [];
  lines.push("---", `category: ${cat.label}`, `description: ${catDesc[cat.id] ?? cat.label}`, `order: ${i + 1}`, "---", "");
  lines.push(`# ${cat.label}`, "");
  lines.push("## Comparison Matrix", "");
  lines.push("| Service | Cost | Student | Commercial | Limits |");
  lines.push("|---------|------|---------|------------|--------|");
  for (const t of items) {
    const link = `[${t.name}](#${slugify(t.name)})`;
    lines.push(`| ${link} | ${cost[t.cost]} | ${student[t.student]} | ${commercial[t.commercial]} | ${t.limits.replace(/\|/g, "\\|")} |`);
  }
  lines.push("", "---", "");
  for (const t of items) {
    lines.push(`## ${t.name}`, "");
    lines.push("| Field | Value |", "|-------|-------|");
    lines.push(`| URL | ${t.url} |`);
    lines.push(`| Cost | ${cost[t.cost]} |`);
    lines.push(`| Student | ${student[t.student]} |`);
    lines.push(`| Commercial | ${commercial[t.commercial]} |`);
    lines.push(`| Limits | ${t.limits.replace(/\|/g, "\\|")} |`);
    if (t.tags?.length) lines.push(`| Tags | ${t.tags.join(", ")} |`);
    if (t.verified) lines.push(`| Verified | ${t.verified} |`);
    lines.push("", t.blurb.replace(/\|/g, "\\|"), "");
    lines.push(`**Pick this if** you want a ${cat.label.toLowerCase()} option that fits the profile above.`, "");
    lines.push("", "---", "");
  }
  writeFileSync(join(outDir, file), lines.join("\n"));
  total += items.length;
  console.log(`${file}: ${items.length} entries`);
}
console.log(`wrote ${total} entries across ${outDir}`);