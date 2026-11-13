#!/usr/bin/env node
/**
 * Compile data/ into the one snapshot the site, API, llms.txt, CLI and MCP read.
 *
 *   pnpm catalog:generate                                    -> src/data/catalog.generated.json
 *   FREESTACK_DATA=tests/fixtures/data pnpm catalog:generate -> tests/fixtures/data/.generated/catalog.json
 *
 * Inputs: aisles.yaml, tools/*.yaml, imported/*.yaml, state/reviews.yaml,
 * state/pricing.yaml, state/links.yaml, presets.yaml, catches.yaml, parts.yaml,
 * situations.yaml, removed.yaml, legacy.yaml. Rules (data/rules.yaml) go to
 * src/data/rules.generated.json so the browser bundle stays small.
 *
 * The build fails loudly on bad data: schema errors, unknown aisles (also for
 * imported entries), unknown tool ids in presets/catches/skip_if, or a null
 * metric without a metric_note. Output is deterministic: same data, same bytes.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

import { aisleMax, scaleStep, RECHECK_DAYS, isSuggested } from "../src/lib/fresh/label.ts";
import { validateTool } from "./lib/validate.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = Boolean(process.env.FREESTACK_DATA);
const dataDir = fixture ? resolve(root, process.env.FREESTACK_DATA) : join(root, "data");
const out = fixture ? join(dataDir, ".generated/catalog.json") : join(root, "src/data/catalog.generated.json");
const rulesOut = join(root, "src/data/rules.generated.json");

const problems = [];
const fail = (msg) => problems.push(msg);

function load(rel, fallback) {
  const p = join(dataDir, rel);
  if (!existsSync(p)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing ${p}`);
  }
  return parse(readFileSync(p, "utf8")) ?? fallback;
}

function yamlFiles(rel) {
  const dir = join(dataDir, rel);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .sort()
    .map((f) => ({ file: `${rel}/${f}`, data: parse(readFileSync(join(dir, f), "utf8")) }));
}

// ---------- Fixture-only relative dates ----------
// Test fixtures store "N days ago" so label states stay right as time passes.
// Real data must use absolute dates.
const today = new Date();
function daysAgo(n) {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - n * 86_400_000);
  return d.toISOString().slice(0, 10);
}
function resolveRelative(obj, where) {
  for (const key of Object.keys(obj)) {
    const m = key.match(/^(.+)_days_ago$/);
    if (!m) continue;
    if (!fixture) {
      fail(`${where}: ${key} is for test fixtures only; use an absolute date`);
      continue;
    }
    const target =
      { verified: "verified_at", checked: "checked_at", changed: "changed_at", opened: "opened" }[m[1]] ?? m[1];
    obj[target] = daysAgo(obj[key]);
    delete obj[key];
  }
  return obj;
}

// ---------- Aisles ----------
const aisles = load("aisles.yaml");
const aisleById = new Map(aisles.map((a) => [a.id, a]));
if (aisleById.size !== aisles.length) fail("aisles.yaml: duplicate aisle id");
// Aisles that measure different things must not share a metric key.
const metricMeaning = new Map();
for (const a of aisles) {
  const meaning = `${a.unit}|${a.label}`;
  if (metricMeaning.has(a.metric) && metricMeaning.get(a.metric) !== meaning) {
    fail(`aisles.yaml: metric ${a.metric} means "${metricMeaning.get(a.metric)}" and "${meaning}"`);
  }
  metricMeaning.set(a.metric, meaning);
}

// ---------- Curated tools ----------
const tools = [];
for (const { file, data } of yamlFiles("tools")) {
  const t = resolveRelative({ ...data }, file);
  const errors = validateTool(t);
  if (errors.length) fail(`${file}: ${errors.join("; ")}`);
  if (`tools/${t.id}.yaml` !== file) fail(`${file}: id ${t.id} does not match the file name`);
  if (!aisleById.has(t.aisle)) fail(`${file}: unknown aisle ${t.aisle}`);
  if (t.metric === null && !t.metric_note) fail(`${file}: metric is null without a metric_note`);
  tools.push(t);
}
const curatedIds = new Set(tools.map((t) => t.id));

// ---------- Trust-loop state ----------
const reviews = (load("state/reviews.yaml", []) ?? []).map((r, i) =>
  resolveRelative({ ...r }, `state/reviews.yaml[${i}]`),
);
const pricing = load("state/pricing.yaml", {}) ?? {};
for (const t of tools) {
  const review = reviews.find((r) => r.tool === t.id);
  if (review) {
    t.review_pending = true;
    t.review_issue = review.issue ?? null;
    t.review_opened = review.opened ?? null;
  }
  const scan = pricing[t.id] ? resolveRelative({ ...pricing[t.id] }, `state/pricing.yaml ${t.id}`) : null;
  // A recheck that lands after the change clears the state.
  if (scan?.changed_at && !(t.verified_at && t.verified_at > scan.changed_at)) t.vendor_changed_at = scan.changed_at;
}
// Link check: labeled tools keep showing with a link_dead flag; imported
// entries whose url failed on two runs are dropped below. Unknown ids are
// ignored (the next check drops them), and a missing file means no data.
const links = load("state/links.yaml", {}) ?? {};
const linkDead = (id) => Boolean(links[id]?.dead_since);
for (const t of tools) if (linkDead(t.id)) t.link_dead = true;
for (const r of reviews) if (!curatedIds.has(r.tool)) fail(`state/reviews.yaml: unknown tool ${r.tool}`);
for (const id of Object.keys(pricing)) if (!curatedIds.has(id)) fail(`state/pricing.yaml: unknown tool ${id}`);

// ---------- Imported (unlabeled) entries ----------
const lists = [];
const importedIds = new Set();
for (const { file, data } of yamlFiles("imported")) {
  if (file === "imported/denylist.yaml") continue; // read by the importer, not a list
  const list = data?.list;
  if (!list?.id || !list?.name) {
    fail(`${file}: needs list.id and list.name`);
    continue;
  }
  const dead = (data.entries ?? []).filter((e) => linkDead(e.id) && !curatedIds.has(e.id));
  for (const e of dead)
    console.log(`  imported ${e.id} (${list.id}) dropped: link dead since ${links[e.id].dead_since}`);
  const live = (data.entries ?? []).filter((e) => !dead.includes(e));
  lists.push({
    id: list.id,
    name: list.name,
    url: list.url,
    license: list.license,
    license_url: list.license_url,
    commit: list.commit,
    fetched_at: list.fetched_at,
    count: live.length,
  });
  for (const e of live) {
    if (!aisleById.has(e.aisle)) {
      fail(`${file}: entry ${e.id} has unknown aisle "${e.aisle}"`);
      continue;
    }
    if (curatedIds.has(e.id)) {
      console.log(`  imported ${e.id} (${list.id}) skipped: it has a curated label`);
      continue;
    }
    if (importedIds.has(e.id)) {
      fail(`${file}: imported id ${e.id} appears in two lists`);
      continue;
    }
    importedIds.add(e.id);
    tools.push({
      id: e.id,
      name: e.name,
      kind: "From an awesome list",
      url: e.url,
      aisle: e.aisle,
      metric: null,
      metric_note: "Not listed",
      limits: [],
      who: [],
      region: null,
      sell: "unknown",
      card: "unknown",
      catches: [],
      use_if: [],
      skip_if: [],
      pricing_url: e.url,
      verified_at: null,
      verified_by: null,
      source: "imported",
      imported_from: list.name,
      imported_list: list.id,
    });
  }
}
const allIds = new Set(tools.map((t) => t.id));

// skip_if.use must point at a tool we list.
for (const t of tools)
  for (const s of t.skip_if)
    if (s.use && !allIds.has(s.use)) fail(`tools/${t.id}.yaml: skip_if uses unknown tool ${s.use}`);

// ---------- Scale (5 steps against the aisle's biggest labeled value) ----------
const maxByAisle = {};
for (const a of aisles) {
  maxByAisle[a.id] = aisleMax(tools.filter((t) => t.aisle === a.id && t.source !== "imported"));
}
for (const t of tools) {
  if (t.source !== "imported") t.scale = scaleStep(t, maxByAisle[t.aisle]);
}

// ---------- Situations, parts, presets, catches, removed, legacy ----------
const situations = load("situations.yaml");
const situationIds = new Set(situations.list.map((s) => s.id));
for (const s of situations.list) {
  for (const id of s.claim ?? []) {
    if (aisleById.get(id)?.group !== "Claim Once")
      fail(`situations.yaml: ${s.id} claims ${id}, which is not a Claim Once aisle`);
  }
}
const parts = load("parts.yaml");
for (const p of parts) if (!aisleById.has(p.aisle)) fail(`parts.yaml: ${p.key} has unknown aisle ${p.aisle}`);

const presets = load("presets.yaml", {}) ?? {};
for (const [sit, rows] of Object.entries(presets)) {
  if (!situationIds.has(sit)) fail(`presets.yaml: unknown situation ${sit}`);
  for (const r of rows ?? []) {
    if (!allIds.has(r.tool)) fail(`presets.yaml: ${sit} uses unknown tool ${r.tool}`);
    if (!parts.some((p) => p.label === r.job)) fail(`presets.yaml: ${sit} job ${r.job} is not a part`);
  }
}

const catches = (load("catches.yaml", []) ?? []).map((c, i) => resolveRelative({ ...c }, `catches.yaml[${i}]`));
for (const c of catches) {
  if (!allIds.has(c.tool)) fail(`catches.yaml: ${c.slug} is about unknown tool ${c.tool}`);
  for (const id of c.avoid_with) if (!allIds.has(id)) fail(`catches.yaml: ${c.slug} avoid_with unknown tool ${id}`);
}

const removed = load("removed.yaml", []) ?? [];
for (const r of removed) if (allIds.has(r.id)) fail(`removed.yaml: ${r.id} is still in the catalog`);

const legacy = load("legacy.yaml", { catalogs: {}, categories: {}, entries: {} });

// ---------- Rules ----------
const rules = parse(readFileSync(join(root, "data/rules.yaml"), "utf8"));

if (problems.length) {
  console.error(`catalog:generate failed (${problems.length}):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

// Suggested tools past the recheck window (the CI staleness gate reads this too).
const stale = tools.filter((t) => t.suggested && !isSuggested(t, today));
for (const t of stale) console.warn(`  warning: ${t.id} is Suggested but not checked within ${RECHECK_DAYS} days`);

// ---------- Write ----------
const order = new Map(aisles.map((a, i) => [a.id, i]));
tools.sort(
  (a, b) =>
    order.get(a.aisle) - order.get(b.aisle) ||
    (a.source === "imported") - (b.source === "imported") ||
    a.id.localeCompare(b.id),
);

// Deterministic "as of" date: the newest date in the data, not the clock.
const dates = [
  ...tools.flatMap((t) => [t.verified_at, t.vendor_changed_at, t.review_opened]),
  ...lists.map((l) => l.fetched_at?.slice(0, 10)),
  ...catches.map((c) => c.checked_at),
].filter(Boolean);
const generatedAt = dates.length ? `${dates.sort().at(-1)}T00:00:00.000Z` : "1970-01-01T00:00:00.000Z";

const snapshot = {
  version: 2,
  generatedAt,
  aisles: aisles.map((a) => ({ ...a, max: maxByAisle[a.id] })),
  tools,
  lists,
  situations: situations.list,
  defaultSituation: situations.default,
  parts,
  presets,
  catches,
  removed,
  legacy,
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");
writeFileSync(rulesOut, JSON.stringify(rules, null, 2) + "\n");

const labeled = tools.filter((t) => t.source !== "imported").length;
console.log(
  `wrote ${out.replace(root + "/", "")}: ${aisles.length} aisles, ${labeled} labeled tools, ${tools.length - labeled} imported from ${lists.length} lists`,
);
