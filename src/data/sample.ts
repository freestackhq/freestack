/**
 * PLACEHOLDER DATA for the fresh UI. Not a source of truth.
 *
 * The data phase (docs/issues/README.md, phase 0) replaces this module with
 * reads from src/data/catalog.generated.json, built from data/tools/*.yaml.
 * Pages must read through src/lib/fresh/catalog.ts, never import this file
 * directly, so the swap touches one place.
 *
 * Numbers here are samples taken from the boards and drafts. Do not ship them
 * as vendor figures. Check dates are relative to build time so each label
 * state stays visible.
 */
import type { Aisle, Catch, PresetRow, Situation, SituationId, Tool } from "../lib/fresh/types";

/*
 * Built lazily: on Cloudflare's prerender (workerd) Date.now() is 0 at module
 * scope, so dates must be computed inside a render.
 */
let today = new Date();
function daysAgo(n: number): string {
  const d = new Date(today.getTime() - n * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export const sampleAisles: Aisle[] = [
  {
    id: "databases",
    group: "Build",
    name: "Databases",
    metric: "storage_gb",
    unit: "GB",
    label: "free storage",
    noun: "databases",
    types: [
      { id: "postgres", label: "Postgres" },
      { id: "sqlite", label: "SQLite" },
      { id: "documents", label: "Documents" },
    ],
    seeAlso: { text: "Redis and queues are in", aisle: "cache", name: "Cache and queues" },
  },
  { id: "cache", group: "Build", name: "Cache and queues", metric: "commands_per_day", unit: "a day", label: "commands", noun: "caches and queues" },
  { id: "hosting", group: "Build", name: "Hosting", metric: "requests_per_day", unit: "a day", label: "requests", noun: "hosts" },
  { id: "auth", group: "Build", name: "Auth and secrets", metric: "monthly_users", unit: "a month", label: "users", noun: "auth and secrets tools" },
  { id: "email", group: "Build", name: "Email", metric: "emails_per_month", unit: "a month", label: "emails", noun: "email services" },
  { id: "storage", group: "Build", name: "Storage", metric: "storage_gb", unit: "GB", label: "free storage", noun: "storage services" },
  { id: "inference", group: "AI", name: "Inference APIs", metric: "requests_per_day", unit: "a day", label: "requests", noun: "inference APIs" },
  { id: "student-programs", group: "Claim Once", name: "Student programs", metric: "duration", unit: "", label: "how long it lasts", noun: "programs" },
];

const base = {
  region: null,
  use_if: [],
  skip_if: [],
  catches: [],
  limits: [],
  verified_at: null,
  verified_by: null,
  source: "catalog",
} as const;

function buildTools(): Tool[] {
  return [
  // ---------- Databases ----------
  {
    ...base,
    id: "neon",
    name: "Neon",
    kind: "Serverless Postgres",
    type: "postgres",
    url: "https://neon.tech",
    aisle: "databases",
    metric: 0.5,
    limits: ["5 GB transfer a month", "Sleeps after 5 minutes idle"],
    who: ["anyone"],
    sell: "yes",
    card: "unknown",
    catches: ["Sleeps after 5 minutes idle"],
    tagline: "Postgres that sleeps when nobody is using it.",
    use_if: [
      "You want a normal SQL database.",
      "You want a test copy for every preview.",
      "Your app is mostly text: users, posts, orders.",
      "A slow first load after a break is fine.",
    ],
    skip_if: [
      { reason: "You also need logins and file uploads.", use: "supabase" },
      { reason: "Your users are all over the world.", use: "turso" },
      { reason: "You are already on Cloudflare Workers.", use: "d1" },
      { reason: "You will have tons of data, like logs.", use: "turso" },
    ],
    catch_detail: [
      "Sleeps after 5 minutes of no traffic. The next visit is slow.",
      "Storage is small. Fine for users, posts and orders, not for files.",
      "Heavy dashboards can burn the monthly data allowance.",
    ],
    fits: ["school", "student", "indie", "startup"],
    pricing_url: "https://neon.tech/pricing",
    verified_at: daysAgo(3),
    verified_by: "Karlo",
    suggested: true,
  },
  {
    ...base,
    id: "supabase",
    name: "Supabase",
    kind: "Postgres plus auth",
    type: "postgres",
    url: "https://supabase.com",
    aisle: "databases",
    metric: 0.5,
    limits: ["1 GB file storage", "Pauses after 1 week idle"],
    who: ["anyone"],
    sell: "yes",
    card: "no",
    catches: ["Pauses after 1 week idle"],
    tagline: "Postgres with sign-in and file uploads built in.",
    use_if: ["You need a database, logins and file uploads in one place."],
    skip_if: [{ reason: "You only need a database.", use: "neon" }],
    fits: ["school", "student", "indie"],
    pricing_url: "https://supabase.com/pricing",
    verified_at: daysAgo(120),
    verified_by: "Karlo",
  },
  {
    ...base,
    id: "turso",
    name: "Turso",
    kind: "Edge SQLite",
    type: "sqlite",
    url: "https://turso.tech",
    aisle: "databases",
    metric: 5,
    limits: ["500 databases", "1 billion row reads a month"],
    who: ["anyone"],
    sell: "yes",
    card: "no",
    tagline: "SQLite copies close to your users.",
    pricing_url: "https://turso.tech/pricing",
    vendor_changed_at: daysAgo(1),
    verified_at: daysAgo(40),
    verified_by: "Karlo",
  },
  {
    ...base,
    id: "d1",
    name: "Cloudflare D1",
    kind: "SQLite on Workers",
    type: "sqlite",
    url: "https://developers.cloudflare.com/d1/",
    aisle: "databases",
    metric: 5,
    limits: ["5 million row reads a day", "Only runs inside Workers"],
    who: ["anyone"],
    sell: "yes",
    card: "no",
    catches: ["Only runs inside Workers"],
    pricing_url: "https://developers.cloudflare.com/d1/platform/pricing/",
    review_pending: true,
  },
  {
    ...base,
    id: "convex",
    name: "Convex",
    kind: "Reactive backend",
    type: "documents",
    url: "https://convex.dev",
    aisle: "databases",
    metric: 0.5,
    limits: ["1 million function calls a month"],
    who: ["anyone"],
    sell: "yes",
    card: "unknown",
    pricing_url: "https://convex.dev/pricing",
  },
  {
    ...base,
    id: "mongo-atlas",
    name: "MongoDB Atlas M0",
    kind: "Document database",
    type: "documents",
    url: "https://www.mongodb.com/atlas",
    aisle: "databases",
    metric: 0.5,
    limits: ["Shared cluster", "100 operations a second"],
    who: ["anyone"],
    sell: "yes",
    card: "no",
    pricing_url: "https://www.mongodb.com/pricing",
  },
  {
    ...base,
    id: "appwrite",
    name: "Appwrite Cloud",
    kind: "Backend as a service",
    type: "documents",
    url: "https://appwrite.io",
    aisle: "databases",
    metric: null,
    metric_note: "Not listed",
    limits: ["75,000 monthly users"],
    who: ["anyone"],
    sell: "unknown",
    card: "unknown",
    pricing_url: "https://appwrite.io/pricing",
  },
  {
    ...base,
    id: "pocketbase",
    name: "PocketBase",
    kind: "Self-hosted SQLite",
    type: "sqlite",
    url: "https://pocketbase.io",
    aisle: "databases",
    metric: null,
    metric_note: "No limit. Your own disk",
    limits: ["You run the server"],
    who: ["anyone"],
    sell: "yes",
    card: "no",
    pricing_url: "https://pocketbase.io",
  },
  {
    ...base,
    id: "xata-lite",
    name: "Xata Lite",
    kind: "Postgres",
    url: "https://xata.io",
    aisle: "databases",
    metric: null,
    who: ["anyone"],
    sell: "unknown",
    card: "unknown",
    pricing_url: "https://xata.io/pricing",
    source: "imported",
    imported_from: "free-for-dev",
  },

  // ---------- Cache ----------
  {
    ...base,
    id: "upstash-redis",
    name: "Upstash Redis",
    kind: "Serverless Redis",
    url: "https://upstash.com",
    aisle: "cache",
    metric: 10000,
    limits: ["256 MB data"],
    who: ["anyone"],
    sell: "yes",
    card: "no",
    pricing_url: "https://upstash.com/pricing",
    verified_at: daysAgo(10),
    verified_by: "Karlo",
  },

  // ---------- Hosting ----------
  {
    ...base,
    id: "cf-workers",
    name: "Cloudflare Workers & Pages",
    kind: "Edge hosting",
    url: "https://workers.cloudflare.com",
    aisle: "hosting",
    metric: 100000,
    limits: ["10 ms CPU per request", "Unlimited static requests"],
    who: ["anyone"],
    sell: "yes",
    card: "no",
    tagline: "Static sites plus API routes. No cold starts.",
    fits: ["school", "student", "indie", "startup"],
    pricing_url: "https://developers.cloudflare.com/workers/platform/pricing/",
    verified_at: daysAgo(5),
    verified_by: "Karlo",
    suggested: true,
  },
  {
    ...base,
    id: "vercel-hobby",
    name: "Vercel Hobby",
    kind: "Frontend hosting",
    url: "https://vercel.com",
    aisle: "hosting",
    metric: null,
    metric_note: "Not listed",
    limits: ["100 GB transfer a month"],
    who: ["anyone"],
    sell: "no",
    card: "no",
    catches: ["Personal projects only"],
    pricing_url: "https://vercel.com/pricing",
    verified_at: daysAgo(30),
    verified_by: "Karlo",
  },
  {
    ...base,
    id: "koyeb",
    name: "Koyeb",
    kind: "Containers",
    url: "https://koyeb.com",
    aisle: "hosting",
    metric: null,
    metric_note: "1 always-on web service",
    who: ["anyone"],
    sell: "yes",
    card: "unknown",
    tagline: "For bots and workers that must never sleep.",
    pricing_url: "https://koyeb.com/pricing",
  },
  {
    ...base,
    id: "render",
    name: "Render",
    kind: "Web services",
    url: "https://render.com",
    aisle: "hosting",
    metric: null,
    metric_note: "750 hours a month",
    who: ["anyone"],
    sell: "yes",
    card: "no",
    catches: ["Sleeps after 15 minutes idle"],
    pricing_url: "https://render.com/pricing",
  },

  // ---------- Auth ----------
  {
    ...base,
    id: "clerk",
    name: "Clerk",
    kind: "Sign-in",
    url: "https://clerk.com",
    aisle: "auth",
    metric: 10000,
    who: ["anyone"],
    sell: "yes",
    card: "no",
    pricing_url: "https://clerk.com/pricing",
    verified_at: daysAgo(12),
    verified_by: "Karlo",
  },
  {
    ...base,
    id: "doppler",
    name: "Doppler",
    kind: "Secrets",
    url: "https://doppler.com",
    aisle: "auth",
    metric: null,
    metric_note: "Not listed",
    who: ["student_school_email"],
    sell: "unknown",
    card: "no",
    catches: ["Ends when you graduate"],
    pricing_url: "https://doppler.com/pricing",
  },

  // ---------- Email ----------
  {
    ...base,
    id: "resend",
    name: "Resend",
    kind: "Email API",
    url: "https://resend.com",
    aisle: "email",
    metric: 3000,
    limits: ["100 emails a day"],
    who: ["anyone"],
    sell: "yes",
    card: "no",
    catches: ["100 a day cap"],
    pricing_url: "https://resend.com/pricing",
  },

  // ---------- Storage ----------
  {
    ...base,
    id: "r2",
    name: "Cloudflare R2",
    kind: "Object storage",
    url: "https://developers.cloudflare.com/r2/",
    aisle: "storage",
    metric: 10,
    limits: ["No fees for data sent out"],
    who: ["anyone"],
    sell: "yes",
    card: "yes",
    pricing_url: "https://developers.cloudflare.com/r2/pricing/",
  },

  // ---------- Inference ----------
  {
    ...base,
    id: "groq",
    name: "Groq",
    kind: "Fast inference",
    url: "https://groq.com",
    aisle: "inference",
    metric: 14400,
    limits: ["30 requests a minute"],
    who: ["anyone"],
    sell: "unknown",
    card: "no",
    pricing_url: "https://groq.com/pricing",
  },

  // ---------- Student programs ----------
  {
    ...base,
    id: "github-student-pack",
    name: "GitHub Student Developer Pack",
    kind: "Student bundle",
    url: "https://education.github.com/pack",
    aisle: "student-programs",
    metric: 24,
    who: ["student_school_email", "student_any_id"],
    sell: "unknown",
    card: "no",
    catches: ["Partner offers rotate"],
    pricing_url: "https://education.github.com/pack",
    program: {
      order: 1,
      lasts_big: "2 yrs",
      lasts_sub: "then verify again",
      perks: ["GitHub Pro, Copilot, Codespaces", "80+ partner offers"],
      needs: "School email or proof of enrollment",
      lasts: "About 2 years, then re-verify",
      claim_url: "https://education.github.com/pack",
    },
  },
  {
    ...base,
    id: "jetbrains-edu",
    name: "JetBrains All Products",
    kind: "Student license",
    url: "https://www.jetbrains.com/community/education/",
    aisle: "student-programs",
    metric: 12,
    who: ["student_school_email"],
    sell: "no",
    card: "no",
    catches: ["Not for paid work"],
    pricing_url: "https://www.jetbrains.com/community/education/",
    program: {
      order: 2,
      lasts_big: "1 yr",
      lasts_sub: "then renew",
      perks: ["IntelliJ, PyCharm, WebStorm", "Rider, CLion and the rest"],
      needs: "School email",
      lasts: "While you are a student",
      claim_url: "https://www.jetbrains.com/community/education/",
    },
  },
  {
    ...base,
    id: "azure-students",
    name: "Azure for Students",
    kind: "Cloud credit",
    url: "https://azure.microsoft.com/free/students/",
    aisle: "student-programs",
    metric: 12,
    who: ["student_school_email"],
    sell: "unknown",
    card: "no",
    catches: ["Credit runs out if you leave VMs on"],
    pricing_url: "https://azure.microsoft.com/free/students/",
    program: {
      order: 3,
      lasts_big: "1 yr",
      lasts_sub: "$100 credit, renews while enrolled",
      perks: ["$100 credit a year", "25+ free services, no credit card"],
      needs: "School email",
      lasts: "Renews while enrolled",
      claim_url: "https://azure.microsoft.com/free/students/",
    },
  },
];
}


export const sampleSituations: Situation[] = [
  { id: "school", label: "Student with school email" },
  { id: "student", label: "Student" },
  { id: "indie", label: "Indie builder" },
  { id: "startup", label: "Startup" },
];

export const defaultSituation: SituationId = "student";

/** Stack presets per situation. Only checked tools can be presets (enforced in catalog.ts). */
export const samplePresets: Record<SituationId, PresetRow[]> = {
  school: [
    { job: "Hosting", tool: "cf-workers" },
    { job: "Database", tool: "neon" },
    { job: "Sign-in", tool: "clerk" },
    { job: "Secrets", tool: "doppler" },
  ],
  student: [
    { job: "Hosting", tool: "cf-workers" },
    { job: "Database", tool: "neon" },
    { job: "Sign-in", tool: "clerk" },
    { job: "Cache", tool: "upstash-redis" },
  ],
  indie: [
    { job: "Hosting", tool: "cf-workers" },
    { job: "Database", tool: "neon" },
    { job: "Sign-in", tool: "clerk" },
  ],
  startup: [],
};

function buildCatches(): Catch[] {
  return [
  {
    slug: "can-i-sell-on-vercel-hobby",
    aisle: "hosting",
    tool: "vercel-hobby",
    question: "Can I sell things on Vercel Hobby?",
    answer: "No.",
    detail: "Hobby is for personal projects only. Anything that makes money for anyone needs a paid plan.",
    includes: [
      "Taking payments, even a tip button",
      "A site for your business or your services",
      "Client work you are paid for",
    ],
    still_fine: "Portfolios, school projects, side projects that earn nothing",
    source_name: "Vercel's Fair Use Guidelines",
    source_url: "https://vercel.com/docs/limits/fair-use-guidelines",
    checked_at: daysAgo(0),
    avoid_with: ["cf-workers", "koyeb"],
  },
];
}


let cache: { tools: Tool[]; catches: Catch[] } | null = null;

/** Sample tools and catches, dated relative to `now`. Rebuilt when the day changes. */
export function sampleData(now: Date): { tools: Tool[]; catches: Catch[] } {
  if (!cache || now.toDateString() !== today.toDateString()) {
    today = now;
    cache = { tools: buildTools(), catches: buildCatches() };
  }
  return cache;
}
