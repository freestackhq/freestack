#!/usr/bin/env node
/**
 * Generate src/data/catalog.generated.json from .catalogs/<owner>-<repo>.
 * The snapshot is committed so `astro build` / tests work offline.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { catalogs } from "../catalogs.config.mjs";
import { parseCategoryFile } from "../src/lib/catalog/parse.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const store = join(root, ".catalogs");
const out = join(root, "src/data/catalog.generated.json");

const snapshot = { generatedAt: new Date().toISOString(), catalogs: [] };
let skipped = 0;

for (const c of catalogs) {
  const repoDir = join(store, `${c.owner}-${c.repo}`);
  if (!existsSync(repoDir)) {
    console.warn(`skip ${c.id}: not fetched (run pnpm catalog:fetch)`);
    skipped++;
    continue;
  }
  const files = readdirSync(repoDir)
    .filter((f) => f.endsWith(".md") && !/^README|^CONTRIBUTING|^ROADMAP/i.test(f))
    .sort();

  const categories = [];
  for (const f of files) {
    const md = readFileSync(join(repoDir, f), "utf8");
    const cat = parseCategoryFile(md, f);
    if (cat && cat.entries.length) categories.push(cat);
  }

  const entryCount = categories.reduce((n, c) => n + c.entries.length, 0);
  snapshot.catalogs.push({
    id: c.id,
    label: c.label,
    description: c.description,
    owner: c.owner,
    repo: c.repo,
    branch: c.branch ?? "main",
    filters: c.filters ?? [],
    categories,
    _entryCount: entryCount,
  });
  console.log(
    `${c.id}: ${categories.length} categories, ${entryCount} entries from ${files.length} files`,
  );
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`wrote ${out} (${snapshot.catalogs.length} catalogs, ${skipped} skipped)`);