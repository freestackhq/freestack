#!/usr/bin/env node
/**
 * Weekly pricing-page scan (trust loop: "Vendor changed").
 *
 *   pnpm ops:pricing-scan                 # scan, write data/state/pricing.yaml
 *   pnpm ops:pricing-scan --dry-run       # scan, print, write nothing
 *   pnpm ops:pricing-scan --today 2026-11-13
 *
 * Fetches each curated tool's pricing_url, reduces the HTML to visible text,
 * and hashes it. State per tool: { hash, checked_at, changed_at }. First
 * sighting stores the hash with changed_at null; a moved hash sets changed_at
 * to today. A failed fetch leaves the entry alone and is only reported.
 * PRICING_SCAN_REPORT=<file> also writes a Markdown report (the PR body).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse, stringify } from "yaml";
import { dataDir, isMain, loadTools, today } from "./tools.mjs";

export const USER_AGENT = "Mozilla/5.0 (compatible; freestack-pricing-scan/1.0)";
const TIMEOUT_MS = 20_000;
const CONCURRENCY = 3;
const HEADER = "# Pricing-page scan: { <tool id>: { hash, checked_at, changed_at } }. Written by the weekly scan.\n";

// ---------- HTML -> visible text ----------
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const VOLATILE = [
  /\b\d{4}-\d{2}-\d{2}(?:[t ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:z|[+-]\d{2}:?\d{2})?)?\b/gi, // ISO dates and times
  /\b\d{1,2}[/.]\d{1,2}[/.]\d{2,4}\b/g, // 11/13/2026
  new RegExp(`\\b${MONTH}\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}\\b`, "gi"), // Nov 13, 2026
  new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+${MONTH},?\\s+\\d{4}\\b`, "gi"), // 13 November 2026
  /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/gi, // clock times
  /\b(?:19|20)\d{2}\b/g, // bare years (copyright lines)
  /\b(?=[a-z0-9_-]*\d)(?=[a-z0-9_-]*[a-z])[a-z0-9_-]{32,}\b/gi, // tokens, nonces, build ids
];

/** Visible text of a page: no scripts, styles, nav or footer, volatile bits dropped, whitespace collapsed. */
export function visibleText(html) {
  let s = String(html);
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  for (const tag of ["head", "script", "style", "noscript", "template", "svg", "nav", "footer", "iframe"]) {
    s = s.replace(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}\\s*>`, "gi"), " ");
  }
  s = s.replace(/<[^>]*>/g, " ");
  s = s.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, e) => {
    const k = e.toLowerCase();
    if (k in ENTITIES) return ENTITIES[k];
    if (k.startsWith("#x")) return String.fromCodePoint(parseInt(k.slice(2), 16));
    if (k.startsWith("#")) return String.fromCodePoint(Number(k.slice(1)));
    return m;
  });
  for (const re of VOLATILE) s = s.replace(re, " ");
  return s.replace(/\s+/g, " ").trim();
}

export function hashText(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// ---------- State ----------
/** Next state entry for a tool after a successful fetch. */
export function nextEntry(prev, hash, day) {
  if (!prev) return { hash, checked_at: day, changed_at: null };
  if (prev.hash === hash) return { hash, checked_at: day, changed_at: prev.changed_at ?? null };
  return { hash, checked_at: day, changed_at: day };
}

export function readState(file) {
  if (!existsSync(file)) return {};
  return parse(readFileSync(file, "utf8")) ?? {};
}

/** Sorted keys, fixed field order, so the same state is always the same bytes. */
export function serializeState(state) {
  const ordered = {};
  for (const id of Object.keys(state).sort()) {
    const e = state[id];
    ordered[id] = { hash: e.hash, checked_at: e.checked_at, changed_at: e.changed_at ?? null };
  }
  return HEADER + stringify(ordered, { lineWidth: 0 });
}

// ---------- Fetch + scan ----------
/** Curated tools with a pricing page. Imported entries are skipped. */
export function scannable(tools) {
  return tools.filter((t) => t.pricing_url && t.source !== "imported");
}

export async function fetchText(url, { fetchImpl = fetch, timeoutMs = TIMEOUT_MS } = {}) {
  const res = await fetchImpl(url, {
    headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = visibleText(await res.text());
  if (!text) throw new Error("no visible text");
  return text;
}

async function pool(items, size, fn) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(size, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift());
  });
  await Promise.all(workers);
}

/**
 * Scan every tool and return the new state plus a report. Entries for tools
 * that are gone (or lost their pricing_url) are dropped so the generator
 * never sees an unknown id.
 */
export async function scan({ tools, state, day, fetchImpl = fetch, concurrency = CONCURRENCY, timeoutMs }) {
  const targets = scannable(tools);
  const next = {};
  const report = { changed: [], added: [], unchanged: [], failed: [], dropped: [] };
  await pool(targets, concurrency, async (t) => {
    const prev = state[t.id];
    try {
      const hash = hashText(await fetchText(t.pricing_url, { fetchImpl, timeoutMs }));
      next[t.id] = nextEntry(prev, hash, day);
      if (!prev) report.added.push(t.id);
      else if (prev.hash !== hash) report.changed.push(t.id);
      else report.unchanged.push(t.id);
    } catch (err) {
      if (prev) next[t.id] = prev;
      report.failed.push({ id: t.id, url: t.pricing_url, error: err?.name === "TimeoutError" ? "timed out" : String(err?.message ?? err) });
    }
  });
  const kept = new Set(targets.map((t) => t.id));
  report.dropped = Object.keys(state).filter((id) => !kept.has(id));
  for (const k of ["changed", "added", "unchanged", "dropped"]) report[k].sort();
  report.failed.sort((a, b) => a.id.localeCompare(b.id));
  return { state: next, report };
}

export function reportMarkdown(report, tools) {
  const url = new Map(tools.map((t) => [t.id, t.pricing_url]));
  const lines = ["The weekly scan saw these pricing pages change. Their labels show \"Vendor changed\" until someone rechecks them.", ""];
  if (report.changed.length) lines.push("### Changed", ...report.changed.map((id) => `- \`${id}\`: ${url.get(id)}`), "");
  if (report.added.length) lines.push("### First scan", ...report.added.map((id) => `- \`${id}\``), "");
  if (report.dropped.length) lines.push("### Dropped (no longer scanned)", ...report.dropped.map((id) => `- \`${id}\``), "");
  if (report.failed.length) {
    lines.push("### Could not fetch (left as they were)", ...report.failed.map((f) => `- \`${f.id}\`: ${f.error} (${f.url})`), "");
  }
  return lines.join("\n");
}

async function main() {
  const dir = dataDir();
  const file = join(dir, "state/pricing.yaml");
  const tools = loadTools(dir);
  const day = today();
  const { state, report } = await scan({ tools, state: readState(file), day });

  console.log(`pricing scan ${day}: ${scannable(tools).length} pages`);
  console.log(`  changed ${report.changed.length}, first seen ${report.added.length}, same ${report.unchanged.length}, failed ${report.failed.length}, dropped ${report.dropped.length}`);
  for (const id of report.changed) console.log(`  changed: ${id}`);
  for (const f of report.failed) console.log(`  failed: ${f.id}: ${f.error}`);

  if (process.env.PRICING_SCAN_REPORT) writeFileSync(process.env.PRICING_SCAN_REPORT, reportMarkdown(report, tools));
  if (process.argv.includes("--dry-run")) return;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, serializeState(state));
}

if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error(`pricing-scan: ${err.message}`);
    process.exit(1);
  });
}
