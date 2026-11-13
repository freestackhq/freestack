#!/usr/bin/env node
/**
 * Staleness gate (trust loop): CI fails if any Suggested tool's label is
 * unchecked or past the recheck window. The window and the day math come
 * from src/lib/fresh/label.ts, so the site and the gate never disagree.
 *
 *   pnpm ops:staleness                     # exit 1 and list offenders, else 0
 *   pnpm ops:staleness --today 2026-11-13
 */
import { RECHECK_DAYS, daysSince } from "../../src/lib/fresh/label.ts";
import { dataDir, isMain, loadTools, today } from "./tools.mjs";

export { RECHECK_DAYS };

/**
 * Tools marked suggested: true whose verified_at is null or older than RECHECK_DAYS.
 * @param {{ id: string, file: string, suggested?: unknown, source?: string, verified_at?: string | Date | null }[]} tools
 * @param {Date} now
 */
export function staleSuggested(tools, now) {
  return tools
    .filter((t) => t.suggested === true && t.source !== "imported")
    .map((t) => ({
      id: t.id,
      file: t.file,
      verified_at: t.verified_at ?? null,
      days: t.verified_at ? daysSince(String(t.verified_at), now) : null,
    }))
    .filter((t) => t.days === null || t.days > RECHECK_DAYS)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function main() {
  const day = today();
  const tools = loadTools(dataDir());
  const stale = staleSuggested(tools, new Date(`${day}T00:00:00Z`));
  const suggested = tools.filter((t) => t.suggested === true).length;
  if (!stale.length) {
    console.log(`staleness gate: ${suggested} suggested tools, all checked within ${RECHECK_DAYS} days`);
    return 0;
  }
  console.error(
    `staleness gate: ${stale.length} suggested tools need a recheck (over ${RECHECK_DAYS} days or never checked):`,
  );
  for (const t of stale) {
    console.error(
      `  ${t.id} (${t.file}): ${t.verified_at ? `checked ${t.verified_at}, ${t.days} days ago` : "never checked"}`,
    );
  }
  console.error("Recheck them, or set suggested: false until someone does.");
  return 1;
}

if (isMain(import.meta.url)) {
  try {
    process.exit(main());
  } catch (err) {
    console.error(`staleness-gate: ${err.message}`);
    process.exit(2);
  }
}
