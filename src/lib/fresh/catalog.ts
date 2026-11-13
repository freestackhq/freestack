/**
 * The one read path for the fresh UI. Pages call these functions and never
 * import the data module directly. Phase 0 swaps the backing data for
 * catalog.generated.json here.
 */
import {
  defaultSituation,
  sampleAisles,
  sampleData,
  samplePresets,
  sampleRemovedTools,
  sampleSituations,
} from "../../data/sample";
import { aisleMax, labelState, sortForAisle } from "./label";
import type { Aisle, AisleGroup, Catch, PresetRow, Situation, SituationId, Tool } from "./types";

export const GROUPS: AisleGroup[] = ["Build", "AI", "Free and Open Data", "Claim Once"];

/**
 * "Now" for label states. A function, not a constant: on Cloudflare's
 * prerender (workerd) the clock reads 0 at module scope.
 */
export function now(): Date {
  return new Date();
}

function data() {
  return sampleData(now());
}

export function aisles(): Aisle[] {
  return sampleAisles;
}

export function aislesByGroup(): { group: AisleGroup; aisles: Aisle[] }[] {
  return GROUPS.map((group) => ({ group, aisles: sampleAisles.filter((a) => a.group === group) }));
}

export function aisle(id: string): Aisle | undefined {
  return sampleAisles.find((a) => a.id === id);
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
  return aisleMax(data().tools.filter((t) => t.aisle === aisleId && t.source !== "imported"));
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
  return sampleSituations;
}

export { defaultSituation };

export function isSituation(id: string | null | undefined): id is SituationId {
  return sampleSituations.some((s) => s.id === id);
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
  return (samplePresets[id] ?? [])
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
  return sampleRemovedTools;
}
