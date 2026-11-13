#!/usr/bin/env node
/**
 * One-time migration: catalogs/{saas,apis,llm-ai}/*.md -> data/tools/<id>.yaml.
 *
 *   node scripts/migrate-catalogs.mjs
 *
 * Writes data/tools/*.yaml, data/legacy.yaml (old catalog URLs -> new pages)
 * and docs/migration-report.md (every source entry -> its tool, plus a check
 * that no number was lost). Rules are in the report's "Assumptions" section.
 *
 * The Markdown snapshot and src/data/sample.ts were deleted after this ran.
 * To re-run, restore them from git first:
 *   git checkout a6928f4 -- catalogs src/data/sample.ts
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, stringify } from "yaml";

import { parseCategoryFile, slugify } from "../src/lib/catalog/parse.mjs";
import { validateTool } from "./lib/validate.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_DIR = join(root, "catalogs");
if (!existsSync(join(CATALOG_DIR, "saas")) || !existsSync(join(root, "src/data/sample.ts"))) {
  console.error("catalogs/ or src/data/sample.ts is gone. Restore them from git to re-run (see the header).");
  process.exit(1);
}
const { sampleData } = await import("../src/data/sample.ts");

// ---------- Placement: where each source entry goes ----------

/** Default aisle per source category. */
const CATEGORY_AISLE = {
  "saas/databases": "databases",
  "saas/hosting": "hosting",
  "saas/auth": "auth",
  "saas/email": "email",
  "saas/storage": "storage",
  "saas/jobs": "jobs",
  "saas/observability": "observability",
  "saas/security": "security",
  "saas/search": "search",
  "saas/ai": "inference",
  "saas/startup": "team",
  "saas/student": "student-programs",
  "saas/design": "design",
  "saas/cloud": "cloud-credits",
  "saas/learning": "learning",
  "saas/ph": "campus",
  "saas/niche": "hosting",
  "apis/crypto": "crypto",
  "apis/data": "reference",
  "apis/finance": "finance",
  "apis/geo": "geo",
  "apis/news": "news",
  "apis/weather": "weather",
  "llm-ai/embeddings": "embeddings",
  "llm-ai/inference": "inference",
  "llm-ai/local": "local-models",
  "llm-ai/observability": "ai-tooling",
  "llm-ai/tooling": "ai-tooling",
};

/**
 * Per-entry overrides: new id (keeps the ids the UI and rules already use),
 * aisle, kind, filter type. Keyed by catalog/category/slug.
 */
const PLACE = {
  // Databases
  "saas/databases/upstash-redis": { aisle: "cache" },
  "saas/databases/cloudflare-d1": { id: "d1" },
  "saas/databases/mongodb-atlas-m0": { id: "mongo-atlas" },
  "saas/databases/appwrite-cloud": { id: "appwrite" },
  "saas/search/clickhouse-cloud": { aisle: "databases", type: "analytics", kind: "Analytics warehouse" },
  "saas/search/duckdb": { aisle: "databases", type: "analytics", kind: "In-process analytics database" },
  "saas/search/sequin": { aisle: "databases", type: "postgres", kind: "Postgres change streams" },
  "saas/search/parquet-arrow": { aisle: "storage", kind: "Open file formats" },
  "saas/niche/motherduck": { aisle: "databases", type: "analytics", kind: "Cloud DuckDB" },
  "saas/niche/tinybird": { aisle: "databases", type: "analytics", kind: "Analytics APIs" },
  // Hosting and servers
  "saas/hosting/cloudflare-workers-and-pages": { id: "cf-workers" },
  "saas/hosting/koyeb": { aisle: "servers" },
  "saas/hosting/railway": { aisle: "servers", kind: "Containers" },
  "saas/hosting/render": { aisle: "servers" },
  "saas/hosting/oracle-cloud-always-free": { aisle: "servers", kind: "Virtual machines" },
  "saas/hosting/coolify": { aisle: "servers", kind: "Self-hosted platform" },
  "saas/startup/fly-io": { aisle: "servers", kind: "Virtual machines" },
  "saas/startup/htmx-go-python-ssr": { aisle: "hosting", kind: "Architecture pattern" },
  "saas/niche/val-town": { kind: "Serverless functions" },
  "saas/niche/livekit-cloud": { kind: "Realtime audio and video" },
  "saas/niche/hugging-face-spaces": { kind: "ML demo hosting" },
  // Auth and secrets
  "saas/auth/clerk": { kind: "Sign-in" },
  "saas/auth/kinde": { kind: "Sign-in" },
  "saas/auth/zitadel": { kind: "Sign-in" },
  "saas/security/better-auth": { aisle: "auth", kind: "Sign-in" },
  "saas/security/supertokens": { aisle: "auth", kind: "Sign-in" },
  "saas/security/workos": { aisle: "auth", kind: "Sign-in" },
  "saas/auth/doppler": { kind: "Secrets" },
  "saas/auth/infisical": { kind: "Secrets" },
  "saas/auth/hookdeck": { aisle: "jobs", kind: "Webhook inbox" },
  // Email, forms, jobs
  "saas/email/tally-formspark": { aisle: "forms", kind: "Form builder" },
  "saas/email/formspree": { aisle: "forms", kind: "Form backend" },
  "saas/email/twilio-trial": { kind: "SMS and voice" },
  "saas/email/vonage-nexmo": { kind: "SMS and voice" },
  "saas/niche/svix": { aisle: "jobs", kind: "Outgoing webhooks" },
  "saas/niche/cron-job-org": { aisle: "jobs", kind: "External cron" },
  // Storage
  "saas/storage/cloudflare-r2": { id: "r2" },
  // Observability
  "saas/startup/plausible-umami": { aisle: "observability", kind: "Web analytics" },
  // Security
  "saas/security/let-s-encrypt": { id: "lets-encrypt" },
  "saas/security/snyk-free": { id: "snyk" },
  // Team and ops
  "saas/student/overleaf": { aisle: "team", kind: "LaTeX editor" },
  "saas/niche/dub-co": { aisle: "team", kind: "Link shortener" },
  // AI
  "saas/ai/cerebras-inference": { id: "cerebras" },
  "saas/ai/deepseek-api": { id: "deepseek" },
  "saas/ai/mistral-ai-api": { id: "mistral" },
  "saas/ai/elevenlabs": { kind: "Text to speech API" },
  "saas/ai/stability-ai": { kind: "Image generation API" },
  "saas/ai/cohere": { aisle: "embeddings", kind: "Embeddings and rerank" },
  "saas/ai/voyage-ai": { aisle: "embeddings", kind: "Embeddings API" },
  "saas/ai/together-embeddings": { aisle: "embeddings", kind: "Embeddings API" },
  "llm-ai/embeddings/cloudflare-workers-ai-embeddings": { id: "workers-ai-embeddings", kind: "Embeddings on Workers" },
  "saas/ai/milvus": { aisle: "vectors", kind: "Self-hosted vector database" },
  "saas/ai/zilliz-cloud": { aisle: "vectors", kind: "Managed Milvus" },
  "saas/ai/qdrant": { aisle: "vectors" },
  "saas/ai/chroma": { aisle: "vectors" },
  "saas/ai/pinecone": { aisle: "vectors" },
  "saas/ai/weaviate": { aisle: "vectors" },
  "saas/ai/pgvector": { aisle: "vectors", kind: "Postgres extension" },
  "saas/ai/ollama": { aisle: "local-models", kind: "Local model runner" },
  "saas/ai/lm-studio": { aisle: "local-models", kind: "Local model app" },
  "llm-ai/local/llama-cpp": { kind: "Local inference engine" },
  "saas/ai/kiro": { aisle: "coding", kind: "AI code editor" },
  "saas/ai/amazon-q-developer": { aisle: "coding", kind: "AI code assistant" },
  "saas/ai/cursor": { aisle: "coding", kind: "AI code editor" },
  "saas/ai/windsurf": { aisle: "coding", kind: "AI code editor" },
  "saas/ai/github-copilot-free": { aisle: "coding", kind: "AI code assistant" },
  "saas/ai/continue-dev": { aisle: "coding", kind: "Open-source code assistant" },
  "saas/ai/langfuse": { aisle: "ai-tooling", kind: "LLM tracing" },
  "saas/ai/helicone": { aisle: "ai-tooling", kind: "LLM proxy and tracing" },
  "saas/ai/langsmith": { aisle: "ai-tooling", kind: "LLM tracing" },
  "saas/ai/mem0": { aisle: "ai-tooling", kind: "Agent memory" },
  "saas/ai/browserbase": { aisle: "ai-tooling", kind: "Hosted browsers" },
  "saas/ai/browserless": { aisle: "ai-tooling", kind: "Headless Chrome API" },
  "saas/ai/tavily": { aisle: "ai-tooling", kind: "Web search for agents" },
  "saas/ai/exa": { aisle: "ai-tooling", kind: "Web search for agents" },
  "saas/ai/llamaindex": { aisle: "ai-tooling", kind: "RAG framework" },
  "saas/ai/flowise": { aisle: "ai-tooling", kind: "Visual agent builder" },
  "saas/ai/vercel-ai-sdk": { aisle: "ai-tooling", kind: "AI SDK" },
  "saas/ai/unsloth": { aisle: "ai-tooling", kind: "Fine-tuning library" },
  "saas/ai/modal": { kind: "Serverless GPUs" },
  "saas/ai/replicate": { kind: "Hosted model API" },
  // Claim Once
  "saas/student/github-student-developer-pack": { id: "github-student-pack" },
  "saas/student/jetbrains-all-products": { id: "jetbrains-edu" },
  "saas/student/azure-for-students": { id: "azure-students" },
  "saas/student/matlab-campus-wide-online": { id: "matlab-campus" },
  "saas/design/figma-education": { aisle: "student-programs" },
  "saas/design/autodesk-education": { aisle: "student-programs", kind: "Student license" },
  "saas/design/canva-education": { aisle: "student-programs", kind: "Student plan" },
  "saas/design/adobe-creative-cloud-student": { aisle: "student-programs", kind: "Student discount" },
  "saas/cloud/namecheap-me-pack": { aisle: "student-programs", kind: "Free domain" },
  "saas/niche/zyte-scrapy-cloud-pack": { aisle: "student-programs", kind: "Scraping cloud" },
  "saas/startup/aws-activate": { aisle: "startup-programs", who: ["startup_proof"] },
  "saas/startup/google-for-startups-cloud": { aisle: "startup-programs", who: ["startup_proof"] },
  "saas/startup/microsoft-for-startups": { aisle: "startup-programs", who: ["startup_proof"] },
};

/** Duplicates: source entry -> the entry it merges into. */
const DUPLICATE_OF = {
  "saas/startup/posthog": "saas/observability/posthog",
  "saas/startup/clerk-startup-path": "saas/auth/clerk",
  "llm-ai/embeddings/voyage-ai": "saas/ai/voyage-ai",
  "llm-ai/embeddings/together-embeddings": "saas/ai/together-embeddings",
  "llm-ai/inference/openrouter": "saas/ai/openrouter",
  "llm-ai/inference/groq": "saas/ai/groq",
  "llm-ai/inference/cerebras": "saas/ai/cerebras-inference",
  "llm-ai/inference/google-ai-studio": "saas/ai/google-ai-studio",
  "llm-ai/inference/mistral": "saas/ai/mistral-ai-api",
  "llm-ai/inference/cloudflare-workers-ai": "saas/ai/cloudflare-workers-ai",
  "llm-ai/inference/deepseek": "saas/ai/deepseek-api",
  "llm-ai/local/ollama": "saas/ai/ollama",
  "llm-ai/local/lm-studio": "saas/ai/lm-studio",
  "llm-ai/observability/langfuse": "saas/ai/langfuse",
  "llm-ai/observability/helicone": "saas/ai/helicone",
  "llm-ai/tooling/vercel-ai-sdk": "saas/ai/vercel-ai-sdk",
  "llm-ai/tooling/continue-dev": "saas/ai/continue-dev",
  "llm-ai/tooling/mem0": "saas/ai/mem0",
};

/** Claim order from the old claim-order guide; the rest follow in catalog order. */
const CLAIM_ORDER = [
  "github-student-pack",
  "jetbrains-edu",
  "azure-students",
  "figma-education",
  "matlab-campus",
  "autodesk-education",
  "unity-student",
];

/** Names in "vs X" lines that are not a tool's own name. */
const NAME_ALIASES = {
  "cloudflare pages": "cf-workers",
  "cloudflare workers": "cf-workers",
  typesense: "typesense-cloud",
  meilisearch: "meilisearch-cloud",
  tally: "tally-formspark",
  twilio: "twilio-trial",
  vonage: "vonage-nexmo",
  pipedream: "pipedream-n8n-cloud",
  "n8n cloud": "pipedream-n8n-cloud",
  snyk: "snyk",
  clickhouse: "clickhouse-cloud",
  cerebras: "cerebras",
  "figma education": "figma-education",
  "heroku (pack)": "heroku-pack",
  "digitalocean (pack)": "digitalocean-pack",
};

const AISLE_KIND = {
  databases: "Database",
  cache: "Cache",
  hosting: "Hosting",
  servers: "Server hosting",
  auth: "Sign-in",
  email: "Email service",
  forms: "Form backend",
  storage: "Object storage",
  jobs: "Background jobs",
  observability: "Monitoring",
  search: "Search service",
  security: "Security tool",
  design: "Design tool",
  team: "Team tool",
  inference: "Inference API",
  embeddings: "Embeddings API",
  vectors: "Vector database",
  "local-models": "Local model runner",
  coding: "AI code assistant",
  "ai-tooling": "AI tool",
  weather: "Weather API",
  geo: "Location API",
  finance: "Finance API",
  crypto: "Crypto API",
  news: "News API",
  reference: "Reference data API",
  campus: "Campus tool",
  "student-programs": "Student offer",
  "cloud-credits": "Cloud credit",
  learning: "Course platform",
  "startup-programs": "Startup credit",
};

const aisles = parseYaml(readFileSync(join(root, "data/aisles.yaml"), "utf8"));
const aisleById = Object.fromEntries(aisles.map((a) => [a.id, a]));

// ---------- Read the catalogs ----------

const sources = [];
for (const catalog of ["saas", "apis", "llm-ai"]) {
  const dir = join(CATALOG_DIR, catalog);
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()) {
    const cat = parseCategoryFile(readFileSync(join(dir, file), "utf8"), file);
    if (!cat) continue;
    for (const e of cat.entries) {
      sources.push({
        key: `${catalog}/${cat.id}/${e.slug}`,
        catalog,
        category: cat.id,
        categoryLabel: cat.label,
        ...e,
      });
    }
  }
}

// ---------- Text helpers ----------

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const clean = (s) =>
  String(s ?? "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
const yn = (v) => (/^✓/.test(v ?? "") ? "yes" : /^✗/.test(v ?? "") ? "no" : "unknown");

/** Plain-English units for limit lines. Numbers are never touched. */
function plain(s) {
  return cap(
    clean(s)
      .replace(/\/\s*mo\b/g, " a month")
      .replace(/\/\s*day\b/g, " a day")
      .replace(/\breq\b/g, "requests"),
  );
}

/** Numeric values in a text: "10k" -> 10000, "1,500" -> 1500, "0.5" -> 0.5. */
function numbers(text) {
  const out = [];
  for (const m of String(text).matchAll(/(\d[\d,]*(?:\.\d+)?)(?:\s?([kKMbB])(?![a-zA-Z]))?/g)) {
    const n = Number(m[1].replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    const mult = { k: 1e3, K: 1e3, M: 1e6, b: 1e9, B: 1e9 }[m[2]] ?? 1;
    out.push(n * mult);
  }
  return out;
}

/** "50k" -> 50000, "~10.5k" -> 10500. */
function toNumber(raw, suffix) {
  const n = Number(String(raw).replace(/,/g, ""));
  return n * ({ k: 1e3, K: 1e3, M: 1e6, B: 1e9 }[suffix] ?? 1);
}

// ---------- Headline metric, per aisle unit ----------

/** Words that may sit next to a GB figure and still mean "storage". */
const STORAGE_WORDS = /^(db|storage|free|disk|shared|data)?$/i;
const NUM = "~?(\\d[\\d,]*(?:\\.\\d+)?)\\s?([kKMB])?";

/**
 * Parsers: segment -> { value, note? } when the segment states the aisle's
 * metric clearly, else null. Segments come from Limits / Free Tier / Rate Limit.
 */
const PARSERS = {
  storage_gb(seg) {
    const m = seg.match(new RegExp(`^${NUM}\\s*(GB|MB|TB)\\b\\s*(.*)$`, "i"));
    if (!m) return null;
    const rest = m[4].trim();
    const perDb = /^\/\s*DB$/i.test(rest);
    if (!perDb && !STORAGE_WORDS.test(rest)) return null;
    let value = toNumber(m[1], m[2]);
    const unit = m[3].toUpperCase();
    const notes = [];
    if (unit === "MB") {
      value = Math.round((value / 1024) * 1000) / 1000;
      notes.push(clean(seg.replace(/^~/, "")));
    } else if (unit === "TB") value *= 1024;
    if (perDb) notes.push("per database");
    return { value, note: notes.join(", ") || undefined };
  },
  bandwidth_gb_month(seg) {
    const m = seg.match(new RegExp(`^${NUM}\\s*GB\\s*(bandwidth|transfer|egress)\\s*/\\s*mo\\b`, "i"));
    return m ? { value: toNumber(m[1], m[2]) } : null;
  },
  ram_gb(seg) {
    const m = seg.match(new RegExp(`^${NUM}\\s*(MB|GB)(\\s*RAM)?$`, "i"));
    if (!m) return null;
    const v = toNumber(m[1], m[2]);
    return m[3].toUpperCase() === "MB"
      ? { value: Math.round((v / 1024) * 1000) / 1000, note: clean(seg) }
      : { value: v };
  },
  monthly_users(seg) {
    const m = seg.match(new RegExp(`${NUM}\\s*(MAU|MRU)\\b`));
    return m ? { value: toNumber(m[1], m[2]) } : null;
  },
  emails_per_day(seg) {
    const m = seg.match(new RegExp(`${NUM}\\s*(emails?\\s*)?/\\s*day`, "i"));
    return m ? { value: toNumber(m[1], m[2]) } : null;
  },
  submissions_per_month(seg) {
    const m = seg.match(new RegExp(`${NUM}\\s*submissions\\s*/\\s*mo\\b`, "i"));
    return m ? { value: toNumber(m[1], m[2]) } : null;
  },
  commands_per_day(seg) {
    const m = seg.match(new RegExp(`${NUM}\\s*commands\\s*/\\s*day`, "i"));
    return m ? { value: toNumber(m[1], m[2]) } : null;
  },
  messages_per_month(seg) {
    const m = seg.match(new RegExp(`${NUM}\\s*messages\\s*/\\s*mo\\b`, "i"));
    return m ? { value: toNumber(m[1], m[2]) } : null;
  },
  ingest_gb_month(seg) {
    const m = seg.match(new RegExp(`${NUM}\\s*GB\\s*(?:/\\s*mo\\b|(?:log\\s*)?ingest\\s*/\\s*mo\\b)`, "i"));
    return m ? { value: toNumber(m[1], m[2]) } : null;
  },
  seats(seg) {
    const m = seg.match(new RegExp(`(?:^|\\s)${NUM}\\s*users\\b`, "i"));
    return m ? { value: toNumber(m[1], m[2]) } : null;
  },
  requests_per_day(seg) {
    const m = seg.match(new RegExp(`${NUM}\\s*(?:req|requests)\\s*/\\s*day(?:\\s*\\(([^)]+)\\))?`, "i"));
    return m ? { value: toNumber(m[1], m[2]), note: m[3] ? cap(m[3]) : undefined } : null;
  },
  completions_per_month(seg) {
    const m = seg.match(new RegExp(`${NUM}\\s*completions\\b[^/]*/\\s*mo\\b`, "i"));
    return m ? { value: toNumber(m[1], m[2]) } : null;
  },
  calls_per_day(seg) {
    const m = seg.match(
      new RegExp(
        `${NUM}\\s*(?:req|requests|calls|API calls)\\s*(?:/|per)\\s*day(?:\\s*\\(?(without token|non-commercial)\\)?)?`,
        "i",
      ),
    );
    return m ? { value: toNumber(m[1], m[2]), note: m[3] ? cap(m[3]) : undefined } : null;
  },
  duration(seg) {
    const m = seg.match(/(?<![$/\d])~?(\d+)\s*-?\s*(yrs?|years?|mo|months?)\b/i);
    if (!m || (/\/\s*mo\b/i.test(seg.slice(m.index + m[0].length - 3, m.index + m[0].length + 1)) && /^\$/.test(seg)))
      return null;
    const n = Number(m[1]);
    return { value: /^y/i.test(m[2]) ? n * 12 : n };
  },
};

const WHILE = /\bwhile\b[^·]*/i;

/** Every number-bearing segment we may read the headline from, in order. */
function metricSegments(src) {
  const f = src.fields;
  if (src.catalog === "saas") return splitLimits(f.Limits);
  return [f["Free Tier"], f["Rate Limit"]].filter(Boolean).map(clean);
}

function splitLimits(s) {
  return String(s ?? "")
    .split("·")
    .map(clean)
    .filter(Boolean);
}

/** Headline for a tool: { metric, metric_note, used } where used is the segment it came from. */
function headlineFor(srcs, aisle) {
  const parse = PARSERS[aisle.metric];
  for (const src of srcs) {
    for (const seg of metricSegments(src)) {
      const hit = parse?.(seg);
      if (hit && Number.isFinite(hit.value)) {
        const notes = [];
        if (/~|\bclass\b/.test(seg)) notes.push("about");
        if (hit.note) notes.push(hit.note);
        // A segment with other figures in it stays in the fine print too.
        const keep = new Set(numbers(seg)).size > 1;
        return {
          metric: hit.value,
          metric_note: notes.length ? cap(notes.join(", ")) : undefined,
          used: keep ? null : seg,
        };
      }
    }
  }
  // Not in the aisle's unit: keep the raw figure, or say it is not listed.
  const segs = srcs.flatMap(metricSegments);
  if (aisle.metric === "duration") {
    const w = segs.map((s) => s.match(WHILE)?.[0]).find(Boolean);
    if (w) return { metric: null, metric_note: cap(clean(w)), used: null };
  }
  const withNumber = segs.find((s) => /\d/.test(s));
  return { metric: null, metric_note: withNumber ? plain(withNumber) : "Not listed", used: null };
}

// ---------- Field mapping ----------

const COST = { "free forever": "free", credits: "credits", "student free": "student", discount: "discount" };

function sellFor(src) {
  const c = (src.fields.Commercial ?? "").toLowerCase();
  if (c === "commercial ok") return "yes";
  if (c === "hobby only" || c === "edu only") return "no";
  if (c === "check tos") return "unknown";
  const text = `${src.fields["Free Tier"] ?? ""} ${src.fields["Rate Limit"] ?? ""}`;
  return /non-commercial|development only/i.test(text) ? "no" : "unknown";
}

function whoFor(src) {
  const s = (src.fields.Student ?? "anyone").toLowerCase();
  if (s === "student required")
    return /sheerid/i.test(src.fields.Limits ?? "") ? ["student_any_id"] : ["student_school_email"];
  return ["anyone"];
}

function cardFor(srcs) {
  const text = srcs.map((s) => [s.fields.Limits, s.fields["Free Tier"], ...s.prose].join(" ")).join(" ");
  if (/no (credit )?card|no CC\b|without a (credit )?card|no-card/i.test(text)) return "no";
  if (/(credit )?card (is )?required|requires a (credit )?card/i.test(text)) return "yes";
  return "unknown";
}

function costFor(src) {
  if (src.fields.Cost) return COST[src.fields.Cost.toLowerCase()] ?? "free";
  return /PAYG|promo credits|credits on signup|tokens on signup/i.test(src.fields["Free Tier"] ?? "")
    ? "credits"
    : "free";
}

function apiFor(srcs) {
  const api = {};
  for (const s of srcs) {
    const f = s.fields;
    const set = (k, v) => {
      if (v !== undefined && v !== "" && api[k] === undefined) api[k] = v;
    };
    set("base_url", f["Base URL"] ?? f["API Base"]);
    set("docs", f.Docs);
    set("auth", f.Auth);
    if (f.CORS) set("cors", yn(f.CORS));
    set("response", f.Response);
    if (f.OpenAPI) set("openapi", yn(f.OpenAPI));
    set("models", f.Models);
    if (f["OpenAI-compatible"]) set("openai_compatible", yn(f["OpenAI-compatible"]));
    if (f.Streaming) set("streaming", yn(f.Streaming));
    if (f["Self-host"]) set("self_host", f["Self-host"].replace(/^✓/, "yes").replace(/^✗/, "no"));
    set("status", f.Status);
  }
  return Object.keys(api).length ? api : undefined;
}

function limitsFor(srcs, used) {
  const out = [];
  for (const s of srcs) {
    if (s.catalog === "saas") {
      for (const seg of splitLimits(s.fields.Limits)) if (seg !== used) out.push(plain(seg));
    } else {
      if (s.fields["Free Tier"] && clean(s.fields["Free Tier"]) !== used) out.push(plain(s.fields["Free Tier"]));
      const rl = s.fields["Rate Limit"];
      if (rl && clean(rl) !== used) out.push(`Rate limit: ${plain(rl).charAt(0).toLowerCase()}${plain(rl).slice(1)}`);
    }
  }
  return [...new Set(out)];
}

/** Catch lines read from the limits: sleeping, expiry, non-commercial, trials. */
const CATCH_WORDS =
  /sleep|pause|scale-to-zero|suspend|expire|expiry|idle|non-commercial|hobby|trial|not forever|prototyping only|rotates|offer sometimes pauses|edu-only/i;

function derivedCatches(srcs, tool) {
  const out = [];
  for (const s of srcs) {
    for (const seg of [...splitLimits(s.fields.Limits), s.fields["Free Tier"] ?? ""]) {
      const p = plain(seg);
      if (p && CATCH_WORDS.test(p) && p.length <= 40) out.push(p);
    }
  }
  const commercial = (srcs[0].fields.Commercial ?? "").toLowerCase();
  if (commercial === "hobby only") out.push("Personal projects only");
  if (commercial === "edu only") out.push("School use only");
  if (tool.sell === "no" && !commercial) out.push("Non-commercial use only");
  if (tool.cost === "discount") out.push("A discount, not a free tier");
  if (tool.cost === "credits" && aisleById[tool.aisle].group !== "Claim Once") out.push("Credits, not a free tier");
  return [...new Set(out)].slice(0, 3);
}

// ---------- Sample prose (curated copy, never its numbers or dates) ----------

const sample = Object.fromEntries(sampleData(new Date("2026-01-01")).tools.map((t) => [t.id, t]));

/**
 * Sample lines that contradict the catalog even without a number:
 * Doppler's free plan is open to anyone; only the Pack upgrade ends at graduation.
 */
const SAMPLE_SKIP = { doppler: ["catches"] };

/** Keep a sample string only if every number in it is also in the catalog's own fields. */
function guard(text, srcs) {
  const nums = numbers(text);
  if (!nums.length) return true;
  const have = new Set(
    srcs.flatMap((s) =>
      numbers(
        Object.entries(s.fields)
          .filter(([k]) => !/url|docs|api base/i.test(k))
          .map(([, v]) => v)
          .join(" "),
      ),
    ),
  );
  return nums.every((n) => have.has(n));
}
const dropped = [];
function keepSample(id, field, list, srcs) {
  const kept = [];
  if (SAMPLE_SKIP[id]?.includes(field)) {
    for (const text of list)
      dropped.push({ id, field, text: typeof text === "string" ? text : text.reason, why: "contradicts the catalog" });
    return kept;
  }
  for (const item of list) {
    const text = typeof item === "string" ? item : item.reason;
    if (guard(text, srcs)) kept.push(item);
    else dropped.push({ id, field, text });
  }
  return kept;
}

// ---------- Build tools ----------

const byKey = Object.fromEntries(sources.map((s) => [s.key, s]));
for (const [dup, primary] of Object.entries(DUPLICATE_OF)) {
  if (!byKey[dup] || !byKey[primary]) throw new Error(`bad duplicate mapping ${dup} -> ${primary}`);
}
const primaries = sources.filter((s) => !DUPLICATE_OF[s.key]);
const idOf = (s) => PLACE[s.key]?.id ?? s.slug;

const nameToId = {};
for (const s of sources) nameToId[s.name.toLowerCase()] = idOf(byKey[DUPLICATE_OF[s.key] ?? s.key]);
Object.assign(nameToId, NAME_ALIASES);

function resolveName(name) {
  const n = name.replace(/:$/, "").trim().toLowerCase();
  return nameToId[n];
}

const tools = [];
const mapping = []; // { key, id, aisle, merged_into? }
const programCounters = {};

for (const src of primaries) {
  const place = PLACE[src.key] ?? {};
  const id = idOf(src);
  const aisleId = place.aisle ?? CATEGORY_AISLE[`${src.catalog}/${src.category}`];
  const aisle = aisleById[aisleId];
  if (!aisle) throw new Error(`no aisle for ${src.key}`);
  const dups = sources.filter((s) => DUPLICATE_OF[s.key] === src.key);
  const srcs = [src, ...dups];
  const s = sample[id];

  const head = headlineFor(srcs, aisle);
  const tool = {
    id,
    name: src.name,
    kind: place.kind ?? s?.kind ?? AISLE_KIND[aisleId],
    url: src.fields.URL ?? src.fields.Docs ?? src.url,
    aisle: aisleId,
    metric: head.metric,
    ...(head.metric_note ? { metric_note: head.metric_note } : {}),
    limits: limitsFor(srcs, head.used),
    who: place.who ?? whoFor(src),
    region: null,
    sell: sellFor(src),
    card: cardFor(srcs),
    cost: costFor(src),
  };
  tool.catches = s?.catches?.length ? keepSample(id, "catches", s.catches, srcs) : [];
  if (!tool.catches.length) tool.catches = derivedCatches(srcs, tool);

  const picks = srcs
    .map((x) => x.pick)
    .filter(Boolean)
    .map((p) => cap(clean(p)));
  const sampleUse = s ? keepSample(id, "use_if", s.use_if, srcs) : [];
  tool.use_if = sampleUse.length ? sampleUse : [...new Set(picks)];

  const sampleSkip = s ? keepSample(id, "skip_if", s.skip_if, srcs) : [];
  const vsSkips = srcs
    .flatMap((x) => x.alternatives)
    .filter((a) => a.text)
    .map((a) => {
      const use = resolveName(a.name);
      const text = clean(a.text.replace(/\*\*/g, ""));
      // Name the alternative when it is not a tool we list.
      const reason = use ? cap(text) : `${a.name.replace(/:$/, "").trim()}: ${text}`;
      return { reason, ...(use && use !== id ? { use } : {}) };
    });
  tool.skip_if = sampleSkip.length
    ? sampleSkip
    : vsSkips.filter((v, i, all) => all.findIndex((o) => o.reason === v.reason) === i);

  tool.pricing_url = tool.url;
  tool.verified_at = srcs.map((x) => x.fields.Verified).find(Boolean) ?? null;
  tool.verified_by = null;
  tool.source = "catalog";

  const firstSentence = (src.prose[0] ?? "").match(/^(.+?[.!?])(\s|$)/)?.[1] ?? src.prose[0];
  const tagline = s?.tagline && guard(s.tagline, srcs) ? s.tagline : firstSentence;
  if (tagline) tool.tagline = clean(tagline);
  const about = srcs
    .flatMap((x) => x.prose)
    .map(clean)
    .filter(Boolean);
  if (about.length) tool.about = [...new Set(about)].join("\n\n");
  if (s?.catch_detail?.length) {
    const cd = keepSample(id, "catch_detail", s.catch_detail, srcs);
    if (cd.length) tool.catch_detail = cd;
  }
  const type = place.type ?? s?.type ?? dbType(src, aisleId);
  if (type) tool.type = type;
  if (s?.fits?.length) tool.fits = s.fits;
  const tags = srcs
    .flatMap((x) => (x.fields.Tags ?? "").split(","))
    .map(clean)
    .filter(Boolean);
  if (tags.length) tool.tags = [...new Set(tags)];
  const api = apiFor(srcs);
  if (api) tool.api = api;

  if (aisle.group === "Claim Once") tool.program = programFor(tool, srcs, head, s);

  // Matrix rows that hold a figure the entry body doesn't (Ollama "100+ open-weight models").
  const body = new Set([...numbers(JSON.stringify(tool)), tool.metric]);
  for (const x of srcs) {
    for (const [col, cell] of Object.entries(x.matrixCells ?? {})) {
      if (/service|api/i.test(col)) continue;
      if (numbers(cell).some((n) => !body.has(n))) tool.limits.push(plain(cell));
    }
  }

  tools.push(tool);
  mapping.push({ key: src.key, id, aisle: aisleId });
  for (const d of dups) mapping.push({ key: d.key, id, aisle: aisleId, merged_into: src.key });
}

function dbType(src, aisleId) {
  if (aisleId !== "databases") return undefined;
  const tags = (src.fields.Tags ?? "").toLowerCase();
  if (/postgres/.test(tags)) return "postgres";
  if (/sqlite/.test(tags)) return "sqlite";
  return "documents";
}

function programFor(tool, srcs, head, s) {
  const sp = s?.program;
  const usedSeg = head.used;
  const months = head.metric;
  const whileSeg = head.metric === null && /^while/i.test(head.metric_note ?? "") ? head.metric_note : null;
  const big =
    months !== null
      ? months % 12 === 0
        ? `${months / 12} ${months === 12 ? "yr" : "yrs"}`
        : `${months} mo`
      : whileSeg
        ? "Enrolled"
        : "?";
  // Sample duration words ("lasts while verified") only stand next to a duration the catalog states.
  const known = months !== null || Boolean(whileSeg);
  const sub = (fallback, timing = false) =>
    sp && guard(fallback.sample, srcs) && (known || !timing) ? fallback.sample : fallback.own;
  const needs = tool.who.includes("startup_proof")
    ? "An application as a startup"
    : tool.who.includes("student_any_id")
      ? "Proof you are a student"
      : tool.who.includes("student_school_email")
        ? "A school email"
        : "Nothing. Open to anyone";
  const perks = sp ? keepSample(tool.id, "program.perks", sp.perks, srcs) : [];
  const ownPerks = splitLimits(srcs[0].fields.Limits)
    .filter((x) => x !== usedSeg)
    .map(plain);
  return {
    order: 0, // set after sorting
    lasts_big: big,
    lasts_sub: sub(
      {
        sample: sp?.lasts_sub ?? "",
        own: months !== null ? plain(usedSeg) : whileSeg ? "lasts while you study" : "Not listed",
      },
      true,
    ),
    perks: perks.length ? perks : ownPerks.length ? ownPerks : [tool.tagline ?? tool.kind],
    needs: sub({ sample: sp?.needs ?? "", own: needs }),
    lasts: sub({ sample: sp?.lasts ?? "", own: months !== null ? plain(usedSeg) : (whileSeg ?? "Not listed") }, true),
    claim_url: tool.url,
  };
}

// Claim order per Claim Once aisle.
for (const a of aisles.filter((x) => x.group === "Claim Once")) {
  const inAisle = tools.filter((t) => t.aisle === a.id);
  const rank = (t) => {
    const i = CLAIM_ORDER.indexOf(t.id);
    return i === -1 ? CLAIM_ORDER.length + inAisle.indexOf(t) : i;
  };
  inAisle.sort((x, y) => rank(x) - rank(y)).forEach((t, i) => (t.program.order = i + 1));
}

// ---------- Checks ----------

const ids = new Set();
for (const t of tools) {
  if (ids.has(t.id)) throw new Error(`duplicate id ${t.id}`);
  ids.add(t.id);
}
for (const t of tools) {
  for (const sk of t.skip_if) if (sk.use && !ids.has(sk.use)) delete sk.use;
  const errors = validateTool(t);
  if (errors.length) throw new Error(`${t.id}: ${errors.join("; ")}`);
}

/** Every number in the source entry must appear in its tool. */
const sourceText = (s) =>
  [
    ...Object.entries(s.fields)
      .filter(([k]) => !/^(url|base url|docs|api base)$/i.test(k))
      .map(([, v]) => v),
    ...s.prose,
    s.pick,
    ...s.alternatives.map((a) => `${a.name} ${a.text}`),
    ...Object.values(s.matrixCells ?? {}),
  ].join(" ");
const toolById = Object.fromEntries(tools.map((t) => [t.id, t]));
const lost = [];
for (const m of mapping) {
  const t = toolById[m.id];
  const have = new Set([...numbers(JSON.stringify(t)), t.metric].filter((x) => x !== null));
  // Converted figures (512 MB -> 0.5 GB) keep the raw text in metric_note.
  const missing = [...new Set(numbers(sourceText(byKey[m.key])))].filter((n) => !have.has(n));
  if (missing.length) lost.push({ key: m.key, id: m.id, missing });
}

// ---------- Write ----------

const toolsDir = join(root, "data/tools");
rmSync(toolsDir, { recursive: true, force: true });
mkdirSync(toolsDir, { recursive: true });
const ORDER = [
  "id",
  "name",
  "kind",
  "url",
  "aisle",
  "metric",
  "metric_note",
  "limits",
  "who",
  "region",
  "sell",
  "card",
  "cost",
  "catches",
  "use_if",
  "skip_if",
  "pricing_url",
  "verified_at",
  "verified_by",
  "source",
  "tagline",
  "about",
  "catch_detail",
  "type",
  "fits",
  "suggested",
  "tags",
  "api",
  "program",
];
for (const t of tools) {
  const ordered = Object.fromEntries(ORDER.filter((k) => t[k] !== undefined).map((k) => [k, t[k]]));
  writeFileSync(join(toolsDir, `${t.id}.yaml`), stringify(ordered, { lineWidth: 0 }));
}

// Old catalog URLs -> new pages. The generator compiles this into the redirects.
const legacy = {
  catalogs: { saas: "/#aisles-h", apis: "/#aisles-h", "llm-ai": "/inference" },
  categories: {},
  entries: {},
};
for (const s of sources) {
  const catKey = `${s.catalog}/${s.category}`;
  legacy.categories[catKey] ??= `/${CATEGORY_AISLE[catKey]}`;
}
for (const m of mapping) legacy.entries[m.key] = `/${m.aisle}/${m.id}`;
writeFileSync(
  join(root, "data/legacy.yaml"),
  "# Old /catalogs/... URLs and their new pages (301). Written by scripts/migrate-catalogs.mjs.\n" +
    stringify(legacy, { lineWidth: 0 }),
);

writeReport();

console.log(
  `${sources.length} source entries -> ${tools.length} tools (${sources.length - primaries.length} merged duplicates)`,
);
console.log(`numbers lost: ${lost.length}, sample strings dropped for unbacked numbers: ${dropped.length}`);
if (lost.length) {
  console.error(lost);
  process.exit(1);
}

function writeReport() {
  const perCatalog = (c) => sources.filter((s) => s.catalog === c).length;
  const aisleCounts = aisles.map((a) => {
    const ts = tools.filter((t) => t.aisle === a.id);
    return `| ${a.group} | \`${a.id}\` | ${a.name} | \`${a.metric}\` | ${ts.length} | ${ts.filter((t) => t.metric !== null).length} |`;
  });
  const sampleIds = Object.keys(sample);
  const lines = [
    "# Catalog migration report",
    "",
    "Generated by `scripts/migrate-catalogs.mjs`. Source: the Markdown snapshot in `catalogs/` (saas, apis, llm-ai). Target: `data/tools/<id>.yaml`.",
    "",
    "## Counts",
    "",
    `- Source entries: **${sources.length}** (saas ${perCatalog("saas")}, apis ${perCatalog("apis")}, llm-ai ${perCatalog("llm-ai")}).`,
    `- Duplicates merged: **${sources.length - primaries.length}**.`,
    `- Tools written: **${tools.length}** = ${sources.length} - ${sources.length - primaries.length}.`,
    `- Tools with a headline number: **${tools.filter((t) => t.metric !== null).length}**. The rest have \`metric: null\` and a \`metric_note\`.`,
    `- Tools with a \`verified_at\` date from the catalog: **${tools.filter((t) => t.verified_at).length}** (verified_by is null for all).`,
    `- Numbers lost: **${lost.length}** entries. Every number in every source entry (fields, matrix row, prose, "Pick this if", "vs" lines) appears in its tool file.`,
    "",
    "## Aisles",
    "",
    "| Group | Aisle | Name | Metric | Tools | With a number |",
    "|---|---|---|---|---|---|",
    ...aisleCounts,
    "",
    "## Assumptions",
    "",
    '- **Numbers come from the catalog only.** The headline `metric` is read from Limits (saas) or Free Tier / Rate Limit (apis, llm-ai) only when a segment states it in the aisle\'s unit. Otherwise `metric: null` and `metric_note` holds the raw figure in its own unit (for example "500 messages a day") or "Not listed".',
    '- Figures marked `~` or "class" keep the number and get `metric_note: About`.',
    "- MB figures in GB aisles are converted (MB / 1024, rounded to 3 places) and the raw figure is kept in `metric_note`.",
    '- The segment used for the headline is removed from `limits`, so the fine print lists the other limits. All other segments stay, with `/mo` and `/day` written as "a month" and "a day".',
    "- **Commercial -> sell:** commercial ok = yes, hobby only / edu only = no, check ToS = unknown. APIs without a Commercial field: no when the free tier says non-commercial or development only, else unknown.",
    "- **Student -> who:** anyone and student helps = `anyone`. Student required = `student_school_email` (the stricter proof), or `student_any_id` when the entry says SheerID. API entries = `anyone`. Startup credit programs (AWS Activate, Google for Startups, Microsoft for Startups) = `startup_proof`, because each says an application is required.",
    '- **Cost:** kept as `cost` (free, credits, student, discount). Credits and student offers that you claim once live in the Claim Once aisles; usage-billed APIs with signup credit stay in their aisle with the catch "Credits, not a free tier".',
    "- **Card:** `no` only when the entry says no card; `yes` only when it says a card is required; else `unknown`.",
    "- **Verified -> verified_at**, `verified_by: null`. The dates are 2026-07-24 and 2026-08-01, so these labels show as overdue. They are not changed.",
    "- **pricing_url** is the tool's URL: the catalog has no separate pricing link. **url** for API entries is the docs page (the base URL is in `api.base_url`). **region** is null (not in the data).",
    "- **Pick this if -> use_if.** **vs X -> skip_if**, with `use` set to X's tool id when X is a tool here.",
    "- **Prose** goes to `tagline` (first sentence) and `about` (all paragraphs).",
    "- **Curated copy from the board samples** (tagline, use_if, skip_if, catches, catch_detail, kind, type, fits, program perks and needs) is kept for the tools that exist in both, but a sample line is dropped when it holds a number the catalog doesn't (listed below). Sample numbers, limits, `verified_at`, `verified_by` and `suggested` are never used. Sample-only tools (xata-lite, fauna) are not in the real data; they live in the test fixtures.",
    '- **Claim Once programs:** `program.lasts_big` comes from the catalog\'s duration ("~2 yrs" -> 24 months -> "2 yrs"), "Enrolled" when it says "while", else "?". Order follows the old claim-order guide, then catalog order.',
    "- Catches not in the samples are read from limit lines about sleeping, pausing, expiry, trials or non-commercial use, plus one for hobby-only, school-only, discount or credit plans.",
    "",
    "## Decisions beyond the migration",
    "",
    "- **Aisle ids.** The draft `student` aisle is `student-programs`, the id the UI and the `/student-programs` route already used. The one imported entry filed under `student` moved with it.",
    "- **Aisles added** (each with the metric its tools list): forms (`submissions_per_month`), jobs (`messages_per_month`), observability (`ingest_gb_month`), search (`records`), security, design and team (`seats`), embeddings (`tokens_per_month`), vectors (`storage_gb`), local-models and campus (`usage`), coding (`completions_per_month`), ai-tooling (`requests_per_month`), weather, geo, finance, crypto, news and reference (`calls_per_day`), cloud-credits, learning and startup-programs (`duration`, in months). A metric key shared by two aisles always has the same unit and label (enforced in tests and by the generator).",
    '- **Aisles with no number yet.** Search, design, team, embeddings, local models, AI tooling, crypto, reference and campus have no tool that lists their metric. Their labels show "?" until someone checks them. Nothing was guessed to fill them.',
    "- **Schema additions** (all optional): `tagline`, `about`, `catch_detail`, `type`, `fits`, `suggested`, `imported_from`, `tags`, `cost`, `api`, `program`.",
    "- **Imported entries** whose id matches a curated tool are skipped by the generator (the curated label wins) and logged; an imported entry in an unknown aisle fails the build.",
    "- **Published CLI.** `@kuyacarlo/freestack` 0.1 calls `/api/tools`, `/api/tools/<id>`, `/api/claim` and `/api/health`, not `/api/entries`. Those endpoints were removed before the redesign, so they are back, reading the new snapshot.",
    "- **Home is server-rendered**, so `/?hint=` and `/?catalog=` can answer with a real 301 (static assets are served before the Worker, so a prerendered page never sees its query string).",
    "",
    "## Duplicates merged",
    "",
    "| Source entry | Merged into | Tool |",
    "|---|---|---|",
    ...mapping.filter((m) => m.merged_into).map((m) => `| \`${m.key}\` | \`${m.merged_into}\` | \`${m.id}\` |`),
    "",
    "## Every source entry",
    "",
    "| Source entry | Tool | Aisle | Old URL redirects to |",
    "|---|---|---|---|",
    ...mapping
      .slice()
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(
        (m) =>
          `| \`${m.key}\` | \`${m.id}\`${m.merged_into ? " (merged)" : ""} | ${m.aisle} | \`/${m.aisle}/${m.id}\` |`,
      ),
    "",
    "## Sample copy dropped",
    "",
    "Lines from `src/data/sample.ts` not kept because they hold a number the catalog doesn't have, or contradict it:",
    "",
    ...(dropped.length
      ? dropped.map((d) => `- \`${d.id}\` ${d.field}: "${d.text}"${d.why ? ` (${d.why})` : ""}`)
      : ["- None."]),
    "",
    `Sample tools matched in the catalog: ${sampleIds.filter((i) => ids.has(i)).length} of ${sampleIds.length}. Not in the catalog: ${
      sampleIds
        .filter((i) => !ids.has(i))
        .map((i) => `\`${i}\``)
        .join(", ") || "none"
    }.`,
    "",
  ];
  writeFileSync(join(root, "docs/migration-report.md"), lines.join("\n"));
}
