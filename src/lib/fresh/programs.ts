/**
 * "I have" filter for Claim Once aisles (Programs.dc.html). Lives in the URL
 * as ?have=school|id|none.
 */
import type { Who } from "./types";

export type Have = "school" | "id" | "none";

export const HAVE_OPTIONS: { id: Have; label: string }[] = [
  { id: "school", label: "A school email" },
  { id: "id", label: "A student ID only" },
  { id: "none", label: "Neither" },
];

export const DEFAULT_HAVE: Have = "school";

export function parseHave(value: string | null | undefined): Have {
  return HAVE_OPTIONS.some((o) => o.id === value) ? (value as Have) : DEFAULT_HAVE;
}

/** Which `who` values each answer satisfies. A school email also proves you are a student. */
const OK: Record<Have, Who[]> = {
  school: ["anyone", "student_school_email", "student_any_id"],
  id: ["anyone", "student_any_id"],
  none: ["anyone"],
};

/** True when someone with `have` can claim a program open to `who`. */
export function canClaim(who: Who[], have: Have): boolean {
  return who.some((w) => OK[have].includes(w));
}
