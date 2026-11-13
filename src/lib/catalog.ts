/**
 * Public API layer over the compiled snapshot: /api/entries, /api/catalogs,
 * /api/tools, /api/claim, llms.txt and the old-URL redirects.
 *
 * The old API grouped entries into three catalogs (saas, apis, llm-ai). Those
 * ids stay as aliases for the new aisle groups, and every entry keeps its old
 * shape (id, catalog, category, fields, pick, prose, alternatives) with the
 * new label fields added next to it.
 */
import { snapshot } from "./fresh/catalog";
import { labelState } from "./fresh/label";
import type { Aisle, AisleGroup, Tool } from "./fresh/types";

const snap = snapshot();
export const GENERATED_AT = snap.generatedAt;

/** Old catalog ids -> the aisle groups they became. */
export const CATALOG_GROUPS: Record<string, AisleGroup[]> = {
  saas: ["Build", "Claim Once"],
  apis: ["Free and Open Data"],
  "llm-ai": ["AI"],
};

const CATALOG_INFO: Record<string, { label: string; description: string }> = {
  saas: { label: "SaaS", description: "Free developer tools and claim-once student and startup programs: limits, who can claim, can you sell." },
  apis: { label: "APIs", description: "Free and open data APIs: weather, maps, money, crypto, news, reference data, plus PH and campus tools." },
  "llm-ai": { label: "LLM & AI", description: "Free inference, embeddings, vector databases, local models and AI tooling." },
};

const aisleById = new Map(snap.aisles.map((a) => [a.id, a]));

export function catalogForGroup(group: AisleGroup): string {
  return Object.entries(CATALOG_GROUPS).find(([, groups]) => groups.includes(group))![0];
}

/** Old entry id ("saas/databases/neon") for each tool that came from the Markdown catalogs. */
const legacyIdByTool = new Map<string, string>();
for (const [key, path] of Object.entries(snap.legacy.entries)) {
  const id = path.split("/").pop()!;
  if (!legacyIdByTool.has(id)) legacyIdByTool.set(id, key);
}

/** Aisle id for a ?category= value: an aisle id, or an old category id. */
export function aisleForCategory(category: string): string | null {
  if (aisleById.has(category)) return category;
  for (const [key, path] of Object.entries(snap.legacy.categories)) {
    if (key.split("/")[1] === category) return path.replace(/^\//, "");
  }
  return null;
}

/** Catalogs in the old shape, counted from the new snapshot. */
export const CATALOGS = Object.entries(CATALOG_GROUPS).map(([id, groups]) => {
  const aisles = snap.aisles.filter((a) => groups.includes(a.group));
  const categories = aisles.map((a) => ({ id: a.id, label: a.name, group: a.group, count: snap.tools.filter((t) => t.aisle === a.id).length }));
  return { id, ...CATALOG_INFO[id], groups, categories, count: categories.reduce((n, c) => n + c.count, 0) };
});

const COST_TEXT = { free: "free forever", credits: "credits", student: "student free", discount: "discount" } as const;
const SELL_TEXT = { yes: "commercial ok", no: "not for commercial use", unknown: "check ToS" } as const;
const mark = (v?: string) => (v === "yes" ? "✓" : v === "no" ? "✗" : v);

function studentText(t: Tool): string {
  if (t.who.length === 0) return "unknown";
  if (t.who.includes("anyone")) return "anyone";
  if (t.who.includes("startup_proof")) return "startup required";
  return "student required";
}

/** Headline in words: "0.5 GB free storage", or the note when the number is not listed. */
export function headlineText(t: Tool, a: Aisle | undefined): string {
  if (t.metric === null) return t.metric_note ?? "Not listed";
  return [String(t.metric), a?.unit, a?.label].filter(Boolean).join(" ");
}

/** The old `fields` table, rebuilt from the new tool fields. */
function fieldsFor(t: Tool, a: Aisle | undefined): Record<string, string> {
  const f: Record<string, string> = {
    URL: t.url,
    Cost: t.cost ? COST_TEXT[t.cost] : "unknown",
    Student: studentText(t),
    Commercial: SELL_TEXT[t.sell],
    Limits: [t.source === "imported" ? null : headlineText(t, a), ...t.limits].filter(Boolean).join(" · "),
  };
  if (t.tags?.length) f.Tags = t.tags.join(", ");
  if (t.verified_at) f.Verified = t.verified_at;
  const api = t.api;
  if (api) {
    const set = (k: string, v?: string) => {
      if (v) f[k] = v;
    };
    set("Base URL", api.base_url);
    set("Docs", api.docs);
    set("Auth", api.auth);
    set("CORS", mark(api.cors));
    set("Response", api.response);
    set("OpenAPI", mark(api.openapi));
    set("Models", api.models);
    set("OpenAI-compatible", mark(api.openai_compatible));
    set("Streaming", mark(api.streaming));
    set("Self-host", api.self_host);
    set("Status", api.status);
  }
  return f;
}

/** One API entry: the old shape plus the label fields. */
export function toEntry(t: Tool, at = new Date()) {
  const a = aisleById.get(t.aisle);
  const catalog = a ? catalogForGroup(a.group) : "saas";
  const toolName = (id?: string) => (id ? snap.tools.find((x) => x.id === id)?.name ?? id : "");
  return {
    // Old fields (kept).
    id: legacyIdByTool.get(t.id) ?? `${catalog}/${t.aisle}/${t.id}`,
    catalog,
    category: t.aisle,
    categoryLabel: a?.name ?? t.aisle,
    name: t.name,
    url: t.url,
    fields: fieldsFor(t, a),
    pick: t.use_if[0] ?? "",
    prose: t.about ? t.about.split("\n\n") : [],
    alternatives: t.skip_if.map((s) => ({ name: toolName(s.use), text: s.reason })),
    // New fields.
    tool: t.id,
    aisle: t.aisle,
    group: a?.group ?? null,
    href: `/${t.aisle}/${t.id}`,
    kind: t.kind,
    tagline: t.tagline ?? null,
    metric: t.metric,
    metric_key: a?.metric ?? null,
    metric_unit: a?.unit ?? null,
    metric_label: a?.label ?? null,
    metric_note: t.metric_note ?? null,
    scale: t.scale ?? null,
    limits: t.limits,
    who: t.who,
    sell: t.sell,
    card: t.card,
    cost: t.cost ?? null,
    catches: t.catches,
    use_if: t.use_if,
    skip_if: t.skip_if,
    pricing_url: t.pricing_url,
    verified_at: t.verified_at,
    verified_by: t.verified_by,
    label_state: labelState(t, at),
    review_pending: Boolean(t.review_pending),
    vendor_changed_at: t.vendor_changed_at ?? null,
    source: t.source,
    imported_from: t.imported_from ?? null,
    api: t.api ?? null,
    program: t.program ?? null,
  };
}

export type ApiEntry = ReturnType<typeof toEntry>;

export type EntryQuery = {
  q?: string;
  /** Old catalog id (saas, apis, llm-ai) or an aisle group name. */
  catalog?: string;
  /** Aisle id or old category id. */
  category?: string;
  aisle?: string;
  group?: string;
  /** Old field filters: { cost: ["free forever"], commercial: ["commercial ok"] }. */
  filters?: Record<string, string[]>;
  limit?: number;
};

/** Case-insensitive field lookup. */
export function entryField(entry: { fields: Record<string, string> }, key: string): string {
  const found = Object.keys(entry.fields).find((k) => k.toLowerCase() === key.toLowerCase());
  return found ? entry.fields[found] : "";
}

function groupsFor(catalog: string): AisleGroup[] | null {
  if (CATALOG_GROUPS[catalog]) return CATALOG_GROUPS[catalog];
  const g = snap.aisles.find((a) => a.group.toLowerCase() === catalog.toLowerCase())?.group;
  return g ? [g] : null;
}

export function queryEntries(query: EntryQuery) {
  let rows = snap.tools.map((t) => toEntry(t));

  for (const c of [query.catalog, query.group].filter(Boolean) as string[]) {
    const groups = groupsFor(c);
    rows = groups ? rows.filter((r) => r.group && groups.includes(r.group)) : [];
  }
  for (const c of [query.category, query.aisle].filter(Boolean) as string[]) {
    const id = aisleForCategory(c);
    rows = id ? rows.filter((r) => r.aisle === id) : [];
  }
  for (const [key, wanted] of Object.entries(query.filters ?? {})) {
    if (!wanted.length) continue;
    rows = rows.filter((r) => {
      const tokens = entryField(r, key).toLowerCase().split(",").map((t) => t.trim());
      return wanted.some((w) => tokens.includes(w.toLowerCase()));
    });
  }
  if (query.q) {
    const q = query.q.toLowerCase();
    rows = rows.filter((r) =>
      [r.name, r.kind, r.tagline ?? "", r.categoryLabel, r.url, ...r.prose, ...r.limits, ...r.catches, ...Object.values(r.fields)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  const count = rows.length;
  if (query.limit && query.limit > 0) rows = rows.slice(0, query.limit);
  return { count, entries: rows };
}

/** Catalog metadata for /api/catalogs and /api/entries?meta=1. */
export function catalogsMeta() {
  return CATALOGS.map((c) => ({
    id: c.id,
    label: c.label,
    description: c.description,
    groups: c.groups,
    categories: c.categories,
    count: c.count,
  }));
}

// ---------- Old URL redirects ----------

/** New path for an old /catalogs/... path, or null when it never existed. */
export function legacyPath(parts: string[]): string | null {
  const [catalog, category, entry] = parts.filter(Boolean);
  if (!catalog) return "/";
  if (!category) return snap.legacy.catalogs[catalog] ?? null;
  if (!entry) return snap.legacy.categories[`${catalog}/${category}`] ?? null;
  return snap.legacy.entries[`${catalog}/${category}/${entry}`] ?? null;
}

/** New path for /?hint=<old category> or /?catalog=<old catalog>, or null. */
export function legacyHomeRedirect(params: URLSearchParams): string | null {
  const hint = params.get("hint");
  if (hint) {
    const hit = Object.entries(snap.legacy.categories).find(([key]) => key === `saas/${hint}` || key.split("/")[1] === hint);
    if (hit) return hit[1];
  }
  const catalog = params.get("catalog");
  if (catalog && snap.legacy.catalogs[catalog]) return snap.legacy.catalogs[catalog];
  return null;
}

// ---------- /api/tools and /api/claim (the published CLI, @kuyacarlo/freestack 0.1) ----------

const CLI_COST: Record<string, Tool["cost"]> = { free: "free", credits: "credits", student_free: "student", discount: "discount" };
const CLI_SELL: Record<string, Tool["sell"]> = { yes: "yes", hobby: "no", edu: "no", check: "unknown" };

/** One tool in the CLI's flat shape, plus the new label fields. */
export function cliTool(t: Tool) {
  const e = toEntry(t);
  return {
    ...e,
    id: t.id,
    legacy_id: e.id,
    blurb: t.tagline ?? t.kind,
    limits: e.fields.Limits,
    limit_lines: t.limits,
    cost: e.fields.Cost,
    student: e.fields.Student,
    commercial: e.fields.Commercial,
  };
}

export function queryTools(p: URLSearchParams) {
  let list = snap.tools;
  const category = p.get("category");
  if (category) {
    const id = aisleForCategory(category);
    list = id ? list.filter((t) => t.aisle === id) : [];
  }
  const cost = p.get("cost");
  if (cost) list = list.filter((t) => t.cost === (CLI_COST[cost] ?? cost));
  const commercial = p.get("commercial");
  if (commercial) list = list.filter((t) => t.sell === (CLI_SELL[commercial] ?? commercial));
  const student = p.get("student");
  if (student === "no" || student === "helps") list = list.filter((t) => t.who.includes("anyone"));
  if (student === "required") list = list.filter((t) => t.who.length > 0 && !t.who.includes("anyone"));
  const q = p.get("q")?.toLowerCase();
  if (q) list = list.filter((t) => [t.name, t.kind, t.tagline ?? "", ...t.limits, ...(t.tags ?? [])].join(" ").toLowerCase().includes(q));
  const count = list.length;
  const limit = Number(p.get("limit"));
  if (limit > 0) list = list.slice(0, limit);
  return { count, tools: list.map(cliTool) };
}

export function findTool(id: string): Tool | undefined {
  return snap.tools.find((t) => t.id === id) ?? snap.tools.find((t) => legacyIdByTool.get(t.id)?.endsWith(`/${id}`));
}

export interface ClaimProfile {
  student: boolean;
  commercial: boolean;
  ph: boolean;
  ai: boolean;
}

export function parseClaimQuery(p: URLSearchParams): ClaimProfile {
  const on = (k: string) => ["1", "true", "yes"].includes(p.get(k) ?? "");
  return { student: on("student"), commercial: on("commercial"), ph: on("ph"), ai: p.get("ai") !== "0" && p.get("ai") !== "false" };
}

/**
 * Claim plan: the Claim Once aisles in order, with the programs this profile
 * can claim. Selling drops programs that do not allow it.
 */
export function buildClaimPlan(profile: ClaimProfile, siteUrl: string) {
  const warnings: string[] = [];
  const aisleIds = [
    ...(profile.student ? ["student-programs", "cloud-credits", "learning"] : []),
    ...(profile.commercial ? ["startup-programs"] : []),
    ...(profile.ph ? ["campus"] : []),
    ...(profile.ai ? ["inference"] : []),
  ];
  const steps = [];
  for (const id of aisleIds) {
    const a = aisleById.get(id);
    if (!a) continue;
    let list = snap.tools.filter((t) => t.aisle === id && t.source !== "imported");
    if (a.group === "Claim Once") {
      list = list.filter((t) => profile.student || !t.who.every((w) => w.startsWith("student"))).sort((x, y) => (x.program?.order ?? 99) - (y.program?.order ?? 99));
    }
    if (profile.commercial) {
      const noSell = list.filter((t) => t.sell === "no");
      if (noSell.length) warnings.push(`${a.name}: skipped ${noSell.map((t) => t.name).join(", ")}. They do not allow selling.`);
      list = list.filter((t) => t.sell !== "no");
    }
    if (!list.length) continue;
    steps.push({
      n: String(steps.length + 1).padStart(2, "0"),
      title: a.name,
      why: a.intro ?? `${a.noun ?? "Tools"} by ${a.label}.`,
      href: `${siteUrl}/${a.id}`,
      tools: list.map((t) => ({
        id: t.id,
        name: t.name,
        limits: [t.program ? `${t.program.lasts_big} ${t.program.lasts_sub}` : headlineText(t, a), ...t.limits].filter(Boolean).join(" · "),
        url: t.program?.claim_url ?? t.url,
        href: `${siteUrl}/${t.aisle}/${t.id}`,
      })),
    });
  }
  const situation = profile.commercial ? (profile.student ? "indie" : "startup") : profile.student ? "student" : "indie";
  return {
    profile,
    stackHint: `Stack presets for you: ${siteUrl}/?as=${situation}`,
    warnings,
    steps,
  };
}
