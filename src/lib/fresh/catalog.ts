/**
 * The one read path for the fresh UI. Pages call these functions and never
 * import the data module directly. The data is the snapshot that
 * `pnpm catalog:generate` compiles from data/ (src/data/catalog.generated.json).
 *
 * Test fixtures: with FREESTACK_DATA set, the build aliases the snapshot to
 * <FREESTACK_DATA>/.generated/catalog.json (astro.config.mjs), and Node
 * processes (Playwright specs) read that file directly below.
 */
import generated from "../../data/catalog.generated.json" with { type: "json" };
import { labelState, sortForAisle } from "./label";
import type { Aisle, AisleGroup, Catch, Part, PresetRow, Situation, SituationId, Tool } from "./types";

export interface Snapshot {
  version: number;
  generatedAt: string;
  aisles: Aisle[];
  tools: Tool[];
  lists: { id: string; name: string; url?: string; license?: string; license_url?: string; commit?: string; fetched_at?: string; count: number }[];
  situations: Situation[];
  defaultSituation: SituationId;
  parts: Part[];
  presets: Partial<Record<SituationId, PresetRow[]>>;
  catches: Catch[];
  removed: { id: string; aisle: string }[];
  legacy: { catalogs: Record<string, string>; categories: Record<string, string>; entries: Record<string, string> };
}

/** Fixture snapshot for Node test processes; null in the Worker and in normal builds. */
function fixtureSnapshot(): Snapshot | null {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined>; getBuiltinModule?: (id: string) => unknown; cwd?: () => string } }).process;
  const dir = proc?.env?.FREESTACK_DATA;
  const fs = dir ? (proc?.getBuiltinModule?.("node:fs") as typeof import("node:fs") | undefined) : undefined;
  const path = dir ? (proc?.getBuiltinModule?.("node:path") as typeof import("node:path") | undefined) : undefined;
  if (!dir || !fs || !path || !proc?.cwd) return null;
  try {
    return JSON.parse(fs.readFileSync(path.resolve(proc.cwd(), dir, ".generated/catalog.json"), "utf8"));
  } catch {
    return null;
  }
}

const SNAPSHOT: Snapshot = fixtureSnapshot() ?? (generated as unknown as Snapshot);

/** The whole compiled snapshot (API, llms.txt, redirects). */
export function snapshot(): Snapshot {
  return SNAPSHOT;
}

export const GROUPS: AisleGroup[] = ["Build", "AI", "Free and Open Data", "Claim Once"];

/**
 * "Now" for label states. A function, not a constant: on Cloudflare's
 * prerender (workerd) the clock reads 0 at module scope.
 */
export function now(): Date {
  return new Date();
}

function data() {
  return SNAPSHOT;
}

export function aisles(): Aisle[] {
  return SNAPSHOT.aisles;
}

export function aislesByGroup(): { group: AisleGroup; aisles: Aisle[] }[] {
  return GROUPS.map((group) => ({ group, aisles: SNAPSHOT.aisles.filter((a) => a.group === group) }));
}

export function aisle(id: string): Aisle | undefined {
  return SNAPSHOT.aisles.find((a) => a.id === id);
}

export function tools(): Tool[] {
  return data().tools;
}

export function tool(id: string): Tool | undefined {
  return data().tools.find((t) => t.id === id);
}

/** Labeled tools in an aisle (imported entries excluded), sorted for the grid. */
export function toolsInAisle(aisleId: string, at = now()): Tool[] {
  return sortForAisle(
    data().tools.filter((t) => t.aisle === aisleId && t.source !== "imported"),
    at,
  );
}

/** Imported, unlabeled entries for an aisle: search only, no filters. */
export function unlabeledInAisle(aisleId: string): Tool[] {
  return data().tools.filter((t) => t.aisle === aisleId && t.source === "imported");
}

/** Biggest known headline value among labeled tools in the aisle. */
export function maxForAisle(aisleId: string): number {
  return aisle(aisleId)?.max ?? 0;
}

/** Count shown in menus: labeled tools only. */
export function aisleCount(aisleId: string): number {
  return data().tools.filter((t) => t.aisle === aisleId && t.source !== "imported").length;
}

export function totalTools(): number {
  return data().tools.length;
}

export function toolHref(t: Tool): string {
  return `/${t.aisle}/${t.id}`;
}

export function checkHref(t: Tool): string {
  return `/${t.aisle}/${t.id}/check`;
}

/** "Write its label" goes to Add a tool, prefilled. */
export function writeLabelHref(t: Tool): string {
  return `/add?name=${encodeURIComponent(t.name)}&url=${encodeURIComponent(t.url)}&aisle=${t.aisle}`;
}

export function situations(): Situation[] {
  return SNAPSHOT.situations;
}

export const defaultSituation: SituationId = SNAPSHOT.defaultSituation;

export function isSituation(id: string | null | undefined): id is SituationId {
  return SNAPSHOT.situations.some((s) => s.id === id);
}

export interface PresetEntry extends PresetRow {
  t: Tool;
}

/**
 * Preset rows for a situation. Rows whose tool is not checked are kept
 * (the page shows them) but flagged by labelState; the next data build
 * drops them. Returns [] when the situation has no valid preset.
 */
export function preset(id: SituationId): PresetEntry[] {
  return (SNAPSHOT.presets[id] ?? [])
    .map((row) => ({ ...row, t: tool(row.tool)! }))
    .filter((row) => row.t);
}

export function presetIsValid(rows: PresetEntry[], at = now()): boolean {
  return rows.length > 0 && rows.every((r) => labelState(r.t, at) === "checked");
}

export function catches(): Catch[] {
  return data().catches;
}

export function catchBySlug(slug: string): Catch | undefined {
  return data().catches.find((c) => c.slug === slug);
}

/** Claim Once programs in an aisle, in claim order. */
export function programsInAisle(aisleId: string): Tool[] {
  return data()
    .tools.filter((t) => t.aisle === aisleId && t.program)
    .sort((a, b) => a.program!.order - b.program!.order);
}

/** Labels for a catch's avoid_with ids. Ids missing from the catalog are skipped. */
export function catchAlternatives(c: Catch): Tool[] {
  return c.avoid_with.map((id) => tool(id)).filter((t): t is Tool => Boolean(t));
}

/** Tools taken out of the catalog. Their pages 301 to the aisle. */
export function removedTools(): { id: string; aisle: string }[] {
  return SNAPSHOT.removed;
}

// ---------- Stack parts (Home, Build a stack, Check my stack) ----------
export function parts(): Part[] {
  return SNAPSHOT.parts;
}

/** The part a preset job fills ("Sign-in" -> auth). */
export function partForJob(job: string): Part | undefined {
  return SNAPSHOT.parts.find((p) => p.label === job);
}

/** Labeled tools that can fill a part, in aisle order. */
export function partOptions(p: Part, at = now()): Tool[] {
  return toolsInAisle(p.aisle, at).filter((t) => !p.kinds || p.kinds.includes(t.kind));
}

/** Catch pages about a tool. */
export function catchesForTool(toolId: string): Catch[] {
  return data().catches.filter((c) => c.tool === toolId);
}
