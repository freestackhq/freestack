#!/usr/bin/env node
/**
 * Import awesome lists into data/imported/<list-id>.yaml (the Unlabeled bin).
 *
 * Every list is fetched at a pinned commit, parsed, mapped to an aisle id from
 * data/aisles.yaml, deduped against the curated catalog and the lists before it,
 * and written with its license header. Entries keep structured fields only
 * (id, name, url, aisle): no descriptions, so no free text reaches the MCP server.
 *
 * Usage: pnpm import:lists            (pinned commits)
 *        pnpm import:lists --latest   (resolve each repo's HEAD; update LISTS after)
 *
 * License review for every candidate list lives in docs/IMPORTS.md.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------------------
// Aisle mapping tables. A rule maps one list section to one aisle. `match` and
// `skip` test the entry's name plus its description (used only to classify,
// never stored). First matching rule wins, so put narrow rules first.
// Rules that point at an aisle missing from data/aisles.yaml are ignored, so
// rules for future aisles can be added before the aisle lands.
// ---------------------------------------------------------------------------

const PUBLIC_APIS_RULES = [
  { section: "Authentication & Authorization", aisle: "auth" },
  {
    section: "Cloud Storage & File Sharing",
    aisle: "storage",
    match: /(cloud|object|decentralized|file) storage|ipfs|pinning|\bs3\b/i,
    skip: /screen|paste|temporary|anonymous|json|attachments/i,
  },
  {
    section: "Email",
    aisle: "email",
    match: /smtp|(send|transactional).*e-?mail|e-?mail.*(send|transactional)/i,
    skip: /disposable|temporary|temp mail|validat|verif|spam/i,
  },
  {
    section: ["Machine Learning", "AI"],
    aisle: "inference",
    // Both lists also carry paid LLM gateways, so the entry must say "free".
    match: /^(?=.*\bfree)(?=.*(\bllms?\b|inference|language models?|openai[- ]compatible|text generation|generative ai))/i,
    skip: /benchmark|pricing|calculator|catalog|news|search|board|translat|compliance/i,
  },
];

export const LISTS = [
  {
    id: "stack-on-a-budget",
    name: "Stack on a budget",
    repo: "255kb/stack-on-a-budget",
    commit: "81bcbd445b4dc00eaa190a7b27a1bdc072aadbbd",
    license: "MIT",
    licenseFile: "LICENSE.md",
    format: "pages",
    sources: [
      "pages/database-hosting.md",
      "pages/emailing.md",
      "pages/messaging-queue-services.md",
      "pages/serverless-app-hosting.md",
      "pages/static-app-hosting.md",
      "pages/app-hosting.md",
      "pages/user-authentication.md",
    ],
    rules: [
      { section: "Database hosting", aisle: "cache", match: /^redis/i },
      { section: "Database hosting", aisle: "databases" },
      { section: "Emailing", aisle: "email", skip: /alias|parser/i },
      { section: "Messaging queue services", aisle: "cache" },
      { section: ["Serverless app hosting", "Static app hosting"], aisle: "hosting" },
      { section: "App hosting", aisle: "servers", skip: /netlify|vercel/i },
      { section: "User authentication", aisle: "auth" },
    ],
  },
  {
    id: "free-for-life",
    name: "Free For Life",
    repo: "wdhdev/free-for-life",
    commit: "697b8d92db259ab25256b72daf50920dc5935b9c",
    license: "MIT",
    licenseFile: "LICENSE",
    format: "tables",
    sources: ["README.md"],
    rules: [
      {
        section: "Databases",
        aisle: "databases",
        // Plain open source engines (MySQL, SQLite...) are software, not a free hosted tier.
        skip: /^(mysql|postgresql|sqlite|apache cassandra|oracle database|redis|mongodb realm)\b|backup|suite of database tools|search/i,
      },
      {
        section: "BaaS",
        aisle: "databases",
        match: /database|data storage|postgres|data objects|app data/i,
        skip: /existing databases/i,
      },
      {
        section: "Email",
        aisle: "email",
        match: /transactional|email api|smtp|emails\/month|emails\/day|send/i,
        skip: /temporary|disposable|forward|alias|verif|spam|dkim|startups|for \d+ months/i,
      },
      { section: "Messaging and Streaming", aisle: "cache", match: /kafka|rabbitmq|amqp|queue|nats/i },
      { section: "PaaS", aisle: "hosting", match: /static (site|web|hosting)/i, skip: /payment/i },
      {
        section: "PaaS",
        aisle: "servers",
        match: /instance|container|docker|app hosting|never sleeps|run(s)? your code|deploy .*apps|python app/i,
        skip: /payment|kubernetes|IDE/i,
      },
      { section: "For Students", aisle: "student-programs", match: /student|education/i },
    ],
  },
  {
    id: "awesome-free-llm-apis",
    name: "Awesome Free LLM APIs",
    repo: "mnfst/awesome-free-llm-apis",
    commit: "7fccf7d57bc96331f1f3cd7918e03363227608c7",
    license: "CC0-1.0",
    licenseFile: "license",
    format: "headingLinks",
    sources: ["README.md"],
    rules: [{ section: ["Provider APIs", "Inference providers"], aisle: "inference" }],
  },
  {
    id: "awesome-free-llm-apis-amar",
    name: "awesome-free-llm-apis (amardeeplakshkar)",
    repo: "amardeeplakshkar/awesome-free-llm-apis",
    commit: "91863d8e7fa9a6dfe5092c7c1cd2f2cf846eccc5",
    license: "CC0-1.0",
    licenseFile: "LICENSE",
    format: "headingLinks",
    sources: ["README.md"],
    rules: [
      {
        section: ["Provider APIs — First-Party Free LLM APIs", "Inference Providers — Free Third-Party LLM Hosting"],
        aisle: "inference",
      },
    ],
  },
  {
    id: "awesome-freellm-apis",
    name: "Awesome FreeLLM APIs",
    repo: "open-free-llm-api/awesome-freellm-apis",
    commit: "ce5332685c9c078cdd58636e649a331ef9ef1e4c",
    license: "MIT",
    licenseFile: "LICENSE",
    format: "htmlLinkTables",
    sources: ["README.md"],
    rules: [{ section: ["Permanent Free Tiers", "Renewable Credits"], aisle: "inference" }],
  },
  {
    id: "public-apis",
    name: "Public APIs",
    repo: "public-apis/public-apis",
    commit: "cb581147b5e7c808cc2db43c5c590b51679dd44c",
    license: "MIT",
    licenseFile: "LICENSE",
    format: "tables",
    sources: ["README.md"],
    rules: PUBLIC_APIS_RULES,
  },
  {
    id: "public-apis-community",
    name: "Public APIs (community)",
    repo: "marcelscruz/public-apis",
    commit: "38b654cb00a4b42e54b5e2a85b193a4ad3eff989",
    license: "MIT",
    licenseFile: "LICENSE",
    format: "tables",
    sources: ["README.md"],
    rules: PUBLIC_APIS_RULES,
  },
];

// ---------------------------------------------------------------------------
// Parsers. Each takes Markdown and returns [{ section, name, url, text }].
// `text` is the raw description, kept in memory for classification only.
// ---------------------------------------------------------------------------

const LINK = /\[([^\]]+)\]\(([^)\s]+)[^)]*\)/;

/** Strip emoji and decoration around a heading: "⚡ Permanent Free Tiers" -> "Permanent Free Tiers". */
export function cleanHeading(raw) {
  return raw
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N})]+$/gu, "")
    .trim();
}

/** `## Section` / `### Section` headings with `| [Name](url) | description | ... |` rows (public-apis, free-for-life). */
export function parseTables(md) {
  const out = [];
  let section = "";
  for (const line of md.split("\n")) {
    const h = line.match(/^#{2,3}\s+(.+)$/);
    if (h) {
      section = cleanHeading(h[1]);
      continue;
    }
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1).map((c) => c.trim());
    const m = cells[0]?.match(new RegExp(`^${LINK.source}$`));
    if (!m) continue;
    out.push({ section, name: m[1], url: m[2], text: cells[1] ?? "" });
  }
  return out;
}

/** `## Section` then `### [Name](url)` per entry, prose below (mnfst and amardeeplakshkar LLM lists; may be indented). */
export function parseHeadingLinks(md) {
  const out = [];
  let section = "";
  let current = null;
  for (const line of md.split("\n")) {
    const h2 = line.match(/^\s*##\s+(.+)$/);
    if (h2) {
      section = cleanHeading(h2[1]);
      current = null;
      continue;
    }
    const h3 = line.match(/^\s*###\s+(.+)$/);
    if (h3) {
      const m = h3[1].match(LINK);
      current = m ? { section, name: m[1], url: m[2], text: "" } : null;
      if (current) out.push(current);
      continue;
    }
    if (current && line.trim() && !current.text) current.text = line.trim();
  }
  return out;
}

/** `### Section` then `| Name | ... | <a href="url">→</a> |` rows (open-free-llm-api). */
export function parseHtmlLinkTables(md) {
  const out = [];
  let section = "";
  for (const line of md.split("\n")) {
    const h = line.match(/^#{2,3}\s+(.+)$/);
    if (h) {
      section = cleanHeading(h[1]);
      continue;
    }
    if (!line.startsWith("|")) continue;
    const href = line.match(/<a\s[^>]*href="([^"]+)"/i);
    if (!href) continue;
    const name = line.split("|")[1]?.trim();
    if (name) out.push({ section, name, url: href[1], text: "" });
  }
  return out;
}

/** One page per category: `# Section`, then `## Name` and the first link below it (stack-on-a-budget). */
export function parsePages(md) {
  const out = [];
  let section = "";
  let current = null;
  for (const line of md.split("\n")) {
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      section = cleanHeading(h1[1]);
      continue;
    }
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      current = { section, name: cleanHeading(h2[1]), url: "", text: "" };
      out.push(current);
      continue;
    }
    if (current && !current.url) {
      const m = line.match(LINK);
      if (m) current.url = m[2];
    }
  }
  return out.filter((e) => e.url);
}

export const PARSERS = {
  tables: parseTables,
  headingLinks: parseHeadingLinks,
  htmlLinkTables: parseHtmlLinkTables,
  pages: parsePages,
};

// ---------------------------------------------------------------------------
// Sanitizing, slugs and dedupe keys.
// ---------------------------------------------------------------------------

/** Keep a short plain name: letters, digits and light punctuation only. null if nothing usable. */
export function cleanName(raw) {
  let s = String(raw)
    .replace(/[*_`<>[\]]/g, "")
    .replace(/[^\p{L}\p{N} .&+'()/:,!-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s || !/[\p{L}\p{N}]/u.test(s)) return null;
  if (s.length > 60) return null;
  if (s === s.toLowerCase() && /^[a-z]/.test(s) && !/[.]/.test(s)) s = s[0].toUpperCase() + s.slice(1);
  return s;
}

/** http(s) only, tracking params and hash dropped. null when not a usable URL. */
export function cleanUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  for (const k of [...u.searchParams.keys()]) if (/^utm_|^ref$/i.test(k)) u.searchParams.delete(k);
  u.hash = "";
  return u.href;
}

export function slugify(name) {
  return String(name)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

// Same product, different names across lists. Keys are nameKey() output.
const NAME_ALIASES = {
  googlegemini: "googlestudio",
  cloudflarepages: "cloudflareworkerspages",
};

/**
 * "Mistral AI", "Mistral" and "mistral.ai" all key to "mistral";
 * "Supabase Postgres" and "Firebase database" drop the trailing product word.
 */
export function nameKey(name) {
  const words = String(name)
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\.(com|io|ai|dev|app|co|net|org|tech|sh)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !/^(api|apis|cloud|ai|inc|the|free|tier|always|hobby)$/.test(w));
  while (words.length > 1 && /^(postgres|postgresql|database|db|auth|authentication|hosting|functions)$/.test(words.at(-1))) {
    words.pop();
  }
  const key = words.join("");
  return NAME_ALIASES[key] ?? key;
}

// Vendors with many unrelated products on one domain: dedupe on host + first
// path segment instead of the whole domain.
const SHARED_ROOTS = new Set([
  "amazon.com", "google.com", "googleapis.com", "microsoft.com", "azure.com", "cloudflare.com",
  "github.com", "github.io", "gitlab.com", "gitlab.io", "rapidapi.com", "oracle.com", "ibm.com",
  "zoho.com", "salesforce.com", "pages.dev", "workers.dev", "vercel.app", "netlify.app",
  "herokuapp.com", "onrender.com", "readthedocs.io", "rtfd.io", "prisma.io", "medium.com",
]);

export function rootDomain(host) {
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  const [sld, tld] = parts.slice(-2);
  const n = tld.length === 2 && sld.length <= 3 ? 3 : 2; // co.uk, com.cn
  return parts.slice(-n).join(".");
}

// Subdomains that name a console or the whole vendor, not one product.
const GENERIC_SUBDOMAINS = new Set([
  "aws", "cloud", "console", "dash", "dashboard", "developer", "developers", "docs", "app", "platform", "portal",
]);

/**
 * Dedupe key for a URL: its root domain. For shared vendors it is the product
 * subdomain (aistudio.google.com), or host + first path segment when the
 * subdomain is generic (aws.amazon.com/lambda vs aws.amazon.com/s3).
 */
export function hostKey(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const r = rootDomain(host);
  if (!SHARED_ROOTS.has(r)) return r;
  const sub = host.slice(0, -r.length - 1).split(".")[0];
  if (sub && !GENERIC_SUBDOMAINS.has(sub)) return host;
  const seg = u.pathname.split("/").filter(Boolean)[0] ?? "";
  return `${host}/${seg.toLowerCase()}`;
}

/** Tracks names, host keys and ids already taken (catalog first, then each accepted import). */
export class Seen {
  constructor() {
    this.names = new Set();
    this.hosts = new Set();
    this.ids = new Set();
  }
  addTool({ id, name, urls = [] }) {
    if (id) this.ids.add(id);
    if (name) {
      const k = nameKey(name);
      if (k) this.names.add(k);
      this.ids.add(slugify(name));
    }
    for (const u of urls) {
      const k = hostKey(u);
      if (k) this.hosts.add(k);
    }
  }
  isDuplicate(name, url) {
    const k = nameKey(name);
    return (k && this.names.has(k)) || this.hosts.has(hostKey(url));
  }
  /** A slug not used by the catalog or any import: "foo", then "foo-2", "foo-3"... */
  uniqueId(name) {
    const base = slugify(name) || "tool";
    let id = base;
    for (let n = 2; this.ids.has(id); n++) id = `${base}-${n}`;
    return id;
  }
}

// ---------------------------------------------------------------------------
// Classification: section + rules -> aisle id (or null).
// ---------------------------------------------------------------------------

export function classify(entry, rules, aisleIds) {
  const hay = `${entry.name} ${entry.text ?? ""}`;
  for (const r of rules) {
    const sections = Array.isArray(r.section) ? r.section : [r.section];
    if (!sections.includes(entry.section)) continue;
    if (!aisleIds.has(r.aisle)) continue;
    if (r.match && !r.match.test(hay)) continue;
    if (r.skip && r.skip.test(hay)) continue;
    return r.aisle;
  }
  return null;
}

/** Parse, classify, clean and dedupe one list's raw entries. Mutates `seen`. */
export function selectEntries(raw, rules, aisleIds, seen) {
  const out = [];
  for (const e of raw) {
    const aisle = classify(e, rules, aisleIds);
    if (!aisle) continue;
    const name = cleanName(e.name);
    const url = cleanUrl(e.url);
    if (!name || !url) continue;
    if (seen.isDuplicate(name, url)) continue;
    const id = seen.uniqueId(name);
    seen.addTool({ id, name, urls: [url] });
    out.push({ id, name, url, aisle });
  }
  return out.sort((a, b) => a.aisle.localeCompare(b.aisle) || a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------------------
// Repo data: aisle ids and the curated catalog.
// ---------------------------------------------------------------------------

export function readAisleIds(dir = root) {
  const yaml = readFileSync(join(dir, "data/aisles.yaml"), "utf8");
  return new Set([...yaml.matchAll(/^- id:\s*([a-z0-9-]+)/gm)].map((m) => m[1]));
}

/** Curated tools from catalogs/**.md sections and data/tools/*.yaml. */
export function readCatalogTools(dir = root) {
  const tools = [];
  const catDir = join(dir, "catalogs");
  if (existsSync(catDir)) {
    for (const sub of readdirSync(catDir, { withFileTypes: true })) {
      if (!sub.isDirectory()) continue;
      for (const f of readdirSync(join(catDir, sub.name)).filter((f) => f.endsWith(".md"))) {
        tools.push(...parseCatalogMarkdown(readFileSync(join(catDir, sub.name, f), "utf8")));
      }
    }
  }
  const toolDir = join(dir, "data/tools");
  if (existsSync(toolDir)) {
    for (const f of readdirSync(toolDir).filter((f) => f.endsWith(".yaml"))) {
      const y = readFileSync(join(toolDir, f), "utf8");
      const field = (k) => y.match(new RegExp(`^${k}:\\s*["']?([^"'#\\n]+?)["']?\\s*(#.*)?$`, "m"))?.[1];
      tools.push({ id: field("id"), name: field("name"), urls: [field("url"), field("pricing_url")].filter(Boolean) });
    }
  }
  return tools;
}

/** `## Name` sections of a curated catalog file, with every URL in their field table. */
export function parseCatalogMarkdown(md) {
  const tools = [];
  let cur = null;
  for (const line of md.split("\n")) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      cur = /comparison matrix/i.test(h[1]) ? null : { name: h[1].trim(), urls: [] };
      if (cur) tools.push(cur);
      continue;
    }
    if (cur && line.startsWith("|")) {
      for (const m of line.matchAll(/https?:\/\/[^\s|)]+/g)) cur.urls.push(m[0]);
    }
  }
  return tools;
}

// ---------------------------------------------------------------------------
// Output: the YAML format the generator lane reads.
// ---------------------------------------------------------------------------

const q = (s) => JSON.stringify(String(s));

export function toYaml(list, entries, licenseText) {
  const header = [
    `Imported from ${list.name} (https://github.com/${list.repo}) at commit ${list.commit}.`,
    `License: ${list.license}. This file is a derivative of that list and keeps its license.`,
    `Generated by scripts/import-lists.mjs. Do not edit by hand; see docs/IMPORTS.md.`,
    "",
    ...licenseText.trimEnd().split("\n"),
  ].map((l) => (l ? `# ${l}` : "#"));
  const meta = [
    "list:",
    `  id: ${q(list.id)}`,
    `  name: ${q(list.name)}`,
    `  url: ${q(`https://github.com/${list.repo}`)}`,
    `  license: ${q(list.license)}`,
    `  license_url: ${q(`https://github.com/${list.repo}/blob/${list.commit}/${list.licenseFile}`)}`,
    `  commit: ${q(list.commit)}`,
    `  fetched_at: ${q(list.fetched_at)}`,
  ];
  const body = entries.length
    ? ["entries:", ...entries.flatMap((e) => [`  - id: ${q(e.id)}`, `    name: ${q(e.name)}`, `    url: ${q(e.url)}`, `    aisle: ${q(e.aisle)}`])]
    : ["entries: []"];
  return [...header, ...meta, ...body].join("\n") + "\n";
}

/** Full license text for short licenses (MIT), a pointer for long ones (CC0 legal code). */
export function licenseComment(list, text) {
  const lines = text.trim().split("\n");
  if (lines.length <= 30) return text;
  return `${lines[0].trim()}\nNo conditions on reuse. Credited anyway. Full text:\nhttps://github.com/${list.repo}/blob/${list.commit}/${list.licenseFile}\n`;
}

// ---------------------------------------------------------------------------
// Runner.
// ---------------------------------------------------------------------------

async function fetchText(repo, commit, path) {
  const url = `https://raw.githubusercontent.com/${repo}/${commit}/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function latestCommit(repo) {
  return execFileSync("git", ["ls-remote", `https://github.com/${repo}`, "HEAD"], { encoding: "utf8" }).split("\t")[0];
}

async function main() {
  const latest = process.argv.includes("--latest");
  const aisleIds = readAisleIds();
  const seen = new Seen();
  for (const t of readCatalogTools()) seen.addTool(t);
  const outDir = join(root, "data/imported");
  mkdirSync(outDir, { recursive: true });
  const fetched_at = new Date().toISOString();

  for (const base of LISTS) {
    const list = { ...base, fetched_at, commit: latest ? latestCommit(base.repo) : base.commit };
    if (latest && list.commit !== base.commit) console.log(`${list.id}: HEAD is ${list.commit} (pinned ${base.commit})`);
    const raw = [];
    for (const src of list.sources) raw.push(...PARSERS[list.format](await fetchText(list.repo, list.commit, src)));
    const license = await fetchText(list.repo, list.commit, list.licenseFile);
    const entries = selectEntries(raw, list.rules, aisleIds, seen);
    writeFileSync(join(outDir, `${list.id}.yaml`), toYaml(list, entries, licenseComment(list, license)));
    const perAisle = Object.entries(Object.groupBy(entries, (e) => e.aisle)).map(([a, es]) => `${a} ${es.length}`);
    console.log(`${list.id}: ${entries.length} of ${raw.length} parsed (${perAisle.join(", ") || "none"})`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
