#!/usr/bin/env node
/**
 * Weekly link check (trust loop: dead vendors and broken links).
 *
 *   pnpm ops:link-check                 # check, write data/state/links.yaml
 *   pnpm ops:link-check --dry-run       # check, print, write nothing
 *   pnpm ops:link-check --today 2026-11-13
 *
 * Checks every curated tool's url and pricing_url and every imported entry's
 * url. HEAD first, GET when HEAD isn't a clean answer, redirects followed.
 * Each link lands in one class:
 *
 *   ok            2xx on the same registrable domain
 *   redirected    2xx after a redirect to another registrable domain (acquired, renamed, shut down)
 *   client_error  4xx other than the "blocked" ones (404 and 410 count as dead)
 *   server_error  5xx
 *   timeout       no answer within the timeout
 *   blocked       401, 403, 429 or a Cloudflare challenge: unknown, never dead
 *   dns           the host does not resolve (dead)
 *   error         any other network failure (TLS, refused, redirect loop): unknown
 *
 * Two-strike rule: a dead-class url (404, 410, dns) records failing_since on
 * first sighting. dead_since is set only when it is still dead on a later day.
 * An ok or redirected answer clears both; an unknown answer keeps them as they
 * were. Only the tool's url decides dead_since; pricing_url is just reported.
 *
 * LINK_CHECK_REPORT=<file> writes a Markdown report (the PR body). Under
 * GitHub Actions it sets the step output `changes=true|false`.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse, stringify } from "yaml";
import { rootDomain } from "../import-lists.mjs";
import { dataDir, isMain, loadTools, today } from "./tools.mjs";

export const USER_AGENT = "Mozilla/5.0 (compatible; freestack-link-check/1.0)";
const TIMEOUT_MS = 10_000;
const CONCURRENCY = 4;
const RETRY_DELAY_MS = 1_500;
const HEADER =
  "# Link check: { <id>: { url_status, pricing_status, final_url, checked_at, failing_since, dead_since } }. Written by the weekly link check.\n";

export const DEAD = new Set(["client_error:404", "client_error:410", "dns"]);
const ALIVE = new Set(["ok", "redirected"]);
const RETRYABLE = new Set(["timeout", "server_error", "error", "dns"]);

/**
 * The slice of fetch the checker uses, so tests can pass a stand-in.
 * @typedef {{ method: string, headers: Record<string, string>, redirect: "follow", signal: AbortSignal }} FetchInit
 * @typedef {{ status: number, url: string, headers?: { get(name: string): string | null } | null, body?: { cancel(): Promise<void> } | null }} FetchResponse
 * @typedef {(url: string, init: FetchInit) => Promise<FetchResponse>} FetchLike
 * @typedef {{ status: string, code: number | null, final_url: string | null, error?: string }} LinkResult
 */

// ---------- Classification ----------
export function registrable(url) {
  try {
    return rootDomain(new URL(url).hostname.toLowerCase().replace(/^www\./, ""));
  } catch {
    return null;
  }
}

/** Class of one HTTP answer. `res` needs status, url and headers. */
export function classifyResponse(res, requested) {
  const code = res.status;
  const final_url = res.url || requested;
  const challenge = res.headers?.get?.("cf-mitigated") === "challenge";
  let status;
  if (challenge || code === 401 || code === 403 || code === 429) status = "blocked";
  else if (code >= 200 && code < 400) status = registrable(final_url) === registrable(requested) ? "ok" : "redirected";
  else if (code >= 400 && code < 500) status = "client_error";
  else status = "server_error";
  return { status, code, final_url };
}

/** Class of a thrown fetch error. */
export function classifyError(err) {
  if (err?.name === "TimeoutError" || err?.name === "AbortError")
    return { status: "timeout", code: null, final_url: null, error: "timed out" };
  const cause = err?.cause ?? {};
  const msg = String(cause.code ?? cause.message ?? err?.message ?? err);
  if (/ENOTFOUND|EAI_NONAME|getaddrinfo/.test(msg) || /ENOTFOUND/.test(String(err?.message))) {
    return { status: "dns", code: null, final_url: null, error: msg };
  }
  return { status: "error", code: null, final_url: null, error: msg };
}

/** "client_error:404" for dead checks; other classes as they are. */
export const deadKey = (r) => (r?.status === "client_error" ? `client_error:${r.code}` : r?.status);
export const isDead = (r) => DEAD.has(deadKey(r));

// ---------- Fetch ----------
/**
 * @param {string} url
 * @param {string} method
 * @param {{ fetchImpl: FetchLike, timeoutMs: number }} opts
 * @returns {Promise<LinkResult>}
 */
async function request(url, method, { fetchImpl, timeoutMs }) {
  try {
    const res = await fetchImpl(url, {
      method,
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    // Drop the body; only the status and final URL matter.
    await res.body?.cancel?.().catch(() => {});
    return classifyResponse(res, url);
  } catch (err) {
    return classifyError(err);
  }
}

/**
 * HEAD, then GET when HEAD isn't ok (many servers answer HEAD badly). One retry for transient failures.
 * @param {string} url
 * @param {{ fetchImpl?: FetchLike, timeoutMs?: number, retryDelayMs?: number }} [opts]
 * @returns {Promise<LinkResult>}
 */
export async function checkUrl(url, { fetchImpl = fetch, timeoutMs = TIMEOUT_MS, retryDelayMs = RETRY_DELAY_MS } = {}) {
  const once = async () => {
    const head = await request(url, "HEAD", { fetchImpl, timeoutMs });
    if (ALIVE.has(head.status)) return head;
    return request(url, "GET", { fetchImpl, timeoutMs });
  };
  let r = await once();
  if (RETRYABLE.has(r.status)) {
    if (retryDelayMs) await new Promise((ok) => setTimeout(ok, retryDelayMs));
    r = await once();
  }
  return r;
}

// ---------- State ----------
/** Next state entry for one id after a check. */
export function nextEntry(prev, url, pricing, day) {
  let failing_since = prev?.failing_since ?? null;
  let dead_since = prev?.dead_since ?? null;
  if (ALIVE.has(url.status)) {
    failing_since = null;
    dead_since = null;
  } else if (isDead(url)) {
    failing_since ??= day;
    // Second strike only on a later day, so a re-run the same day never counts.
    if (!dead_since && failing_since < day) dead_since = day;
  }
  return {
    url_status: deadKey(url),
    pricing_status: pricing ? deadKey(pricing) : null,
    final_url: url.final_url ?? null,
    checked_at: day,
    failing_since,
    dead_since,
  };
}

export function readState(file) {
  if (!existsSync(file)) return {};
  return parse(readFileSync(file, "utf8")) ?? {};
}

const FIELDS = ["url_status", "pricing_status", "final_url", "checked_at", "failing_since", "dead_since"];

/** Sorted keys, fixed field order, so the same state is always the same bytes. */
export function serializeState(state) {
  const ordered = {};
  for (const id of Object.keys(state).sort())
    ordered[id] = Object.fromEntries(FIELDS.map((f) => [f, state[id][f] ?? null]));
  return HEADER + stringify(ordered, { lineWidth: 0 });
}

/** True when anything but checked_at and final_url moved, or an id came or went. */
export function meaningfulChange(prev, next) {
  const ids = new Set([...Object.keys(prev), ...Object.keys(next)]);
  for (const id of ids) {
    const a = prev[id];
    const b = next[id];
    if (!a || !b) return true;
    for (const f of ["url_status", "pricing_status", "failing_since", "dead_since"])
      if ((a[f] ?? null) !== (b[f] ?? null)) return true;
  }
  return false;
}

// ---------- Targets ----------
/** Every imported entry: [{ id, name, url, list }]. */
export function loadImported(dir) {
  const imp = join(dir, "imported");
  if (!existsSync(imp)) return [];
  return readdirSync(imp)
    .filter((f) => f.endsWith(".yaml") && f !== "denylist.yaml")
    .sort()
    .flatMap((f) => {
      const data = parse(readFileSync(join(imp, f), "utf8")) ?? {};
      return (data.entries ?? []).map((e) => ({ id: e.id, name: e.name, url: e.url, list: data.list?.id ?? f }));
    });
}

/** One target per id: curated tools check url + pricing_url, imported entries only url. */
export function targets(tools, imported) {
  const curated = tools.map((t) => ({
    id: t.id,
    name: t.name,
    url: t.url,
    pricing_url: t.pricing_url ?? null,
    source: "labeled",
  }));
  const ids = new Set(curated.map((t) => t.id));
  const extra = imported
    .filter((e) => !ids.has(e.id))
    .map((e) => ({ id: e.id, name: e.name, url: e.url, pricing_url: null, source: "imported", list: e.list }));
  return [...curated, ...extra];
}

async function pool(items, size, fn) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(size, queue.length) }, async () => {
      while (queue.length) await fn(queue.shift());
    }),
  );
}

/**
 * Check every target. Each distinct URL is fetched once. Returns the new state and per-id results.
 * @param {{
 *   targets: ReturnType<typeof targets>, state: Record<string, ReturnType<typeof nextEntry>>, day: string,
 *   fetchImpl?: FetchLike, concurrency?: number, timeoutMs?: number, retryDelayMs?: number
 * }} opts
 */
export async function run({
  targets: list,
  state,
  day,
  fetchImpl = fetch,
  concurrency = CONCURRENCY,
  timeoutMs,
  retryDelayMs,
}) {
  const urls = [...new Set(list.flatMap((t) => [t.url, t.pricing_url]).filter(Boolean))];
  const results = new Map();
  await pool(urls, concurrency, async (u) => results.set(u, await checkUrl(u, { fetchImpl, timeoutMs, retryDelayMs })));
  /** @type {Record<string, ReturnType<typeof nextEntry>>} */
  const next = {};
  const rows = [];
  for (const t of list) {
    const url = results.get(t.url) ?? { status: "error", code: null, final_url: null, error: "no url" };
    const pricing = t.pricing_url ? results.get(t.pricing_url) : null;
    next[t.id] = nextEntry(state[t.id], url, pricing, day);
    rows.push({ ...t, urlResult: url, pricingResult: pricing, entry: next[t.id] });
  }
  rows.sort((a, b) => a.id.localeCompare(b.id));
  return { state: next, rows };
}

// ---------- Report ----------
const CLASSES = ["ok", "redirected", "client_error", "server_error", "timeout", "blocked", "dns", "error"];

export function totals(rows, pick) {
  const out = Object.fromEntries(CLASSES.map((c) => [c, 0]));
  for (const r of rows) {
    const res = pick(r);
    if (res) out[res.status]++;
  }
  return out;
}

const fmt = (r) => `${r.status}${r.code ? ` ${r.code}` : ""}${r.error ? ` (${r.error})` : ""}`;

export function reportMarkdown(rows) {
  const lines = [
    "The weekly link check found these links that need a look. Blocked and timed-out links are unknown, not dead.",
    "",
  ];
  const t = (label, pick, subset) =>
    `- ${label}: ${Object.entries(totals(subset, pick))
      .filter(([, n]) => n)
      .map(([k, n]) => `${k} ${n}`)
      .join(", ")}`;
  const labeled = rows.filter((r) => r.source === "labeled");
  const imported = rows.filter((r) => r.source === "imported");
  lines.push(
    "### Totals",
    t("labeled url", (r) => r.urlResult, labeled),
    t("labeled pricing_url", (r) => r.pricingResult, labeled),
    t("imported url", (r) => r.urlResult, imported),
    "",
  );
  const dead = rows.filter((r) => r.entry.dead_since);
  if (dead.length)
    lines.push(
      "### Dead (failed on two runs)",
      ...dead.map((r) => `- \`${r.id}\` (${r.source}) since ${r.entry.dead_since}: ${fmt(r.urlResult)} ${r.url}`),
      "",
    );
  const failing = rows.filter((r) => r.entry.failing_since && !r.entry.dead_since);
  if (failing.length)
    lines.push(
      "### Failing (first strike)",
      ...failing.map((r) => `- \`${r.id}\` (${r.source}) since ${r.entry.failing_since}: ${fmt(r.urlResult)} ${r.url}`),
      "",
    );
  const section = (title, pick, urlOf) => {
    const hit = rows.filter((r) => pick(r) && pick(r).status !== "ok" && !isDead(pick(r)));
    if (!hit.length) return;
    lines.push(
      `### ${title}`,
      ...hit.map((r) => {
        const res = pick(r);
        const to = res.final_url && res.final_url !== urlOf(r) ? ` -> ${res.final_url}` : "";
        return `- \`${r.id}\` (${r.source}): ${fmt(res)} ${urlOf(r)}${to}`;
      }),
      "",
    );
  };
  section(
    "Other url problems",
    (r) => r.urlResult,
    (r) => r.url,
  );
  // A pricing_url that is the same link as url is already listed above.
  const ownPricing = (r) => (r.pricing_url !== r.url ? r.pricingResult : null);
  section("pricing_url problems", ownPricing, (r) => r.pricing_url);
  const deadPricing = rows.filter((r) => ownPricing(r) && isDead(r.pricingResult));
  if (deadPricing.length)
    lines.push(
      "### Dead pricing_url (product url may be fine)",
      ...deadPricing.map((r) => `- \`${r.id}\`: ${fmt(r.pricingResult)} ${r.pricing_url}`),
      "",
    );
  return lines.join("\n");
}

async function main() {
  const dir = dataDir();
  const file = join(dir, "state/links.yaml");
  const list = targets(loadTools(dir), loadImported(dir));
  const day = today();
  const prev = readState(file);
  const { state, rows } = await run({ targets: list, state: prev, day });

  console.log(`link check ${day}: ${list.length} ids`);
  for (const [label, src, pick] of [
    ["labeled url", "labeled", (r) => r.urlResult],
    ["labeled pricing_url", "labeled", (r) => r.pricingResult],
    ["imported url", "imported", (r) => r.urlResult],
  ]) {
    const n = totals(
      rows.filter((r) => r.source === src),
      pick,
    );
    console.log(`  ${label}: ${CLASSES.map((c) => `${c} ${n[c]}`).join(", ")}`);
  }
  for (const r of rows)
    if (r.entry.failing_since)
      console.log(`  ${r.entry.dead_since ? "dead" : "failing"}: ${r.id} (${r.source}) ${fmt(r.urlResult)} ${r.url}`);

  const changes = meaningfulChange(prev, state);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changes=${changes}\n`);
  if (process.env.LINK_CHECK_REPORT) writeFileSync(process.env.LINK_CHECK_REPORT, reportMarkdown(rows));
  if (process.argv.includes("--dry-run")) return;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, serializeState(state));
}

if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error(`link-check: ${err.message}`);
    process.exit(1);
  });
}
