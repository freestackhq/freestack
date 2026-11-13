/**
 * Shared helpers for the ops scripts: where the data lives, reading every
 * data/tools/*.yaml, and today's date.
 *
 * FREESTACK_DATA points the scripts at another data dir (tests use fixtures),
 * the same switch scripts/generate.mjs uses.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

export function dataDir(env = process.env) {
  return env.FREESTACK_DATA ? resolve(env.FREESTACK_DATA) : join(ROOT, "data");
}

/** Every tools/*.yaml in the data dir, sorted by file name. Bad YAML throws with the file name. */
export function loadTools(dir) {
  const toolDir = join(dir, "tools");
  if (!existsSync(toolDir)) return [];
  return readdirSync(toolDir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort()
    .map((f) => {
      let data;
      try {
        data = parse(readFileSync(join(toolDir, f), "utf8"));
      } catch (err) {
        throw new Error(`tools/${f}: ${err.message}`);
      }
      if (!data || typeof data !== "object") throw new Error(`tools/${f}: not a YAML map`);
      return { ...data, id: data.id ?? f.replace(/\.ya?ml$/, ""), file: `tools/${f}` };
    });
}

/** --today YYYY-MM-DD wins (tests); otherwise today's UTC date. */
export function today(argv = process.argv) {
  const i = argv.indexOf("--today");
  const given = i >= 0 ? argv[i + 1] : null;
  if (given && !/^\d{4}-\d{2}-\d{2}$/.test(given)) throw new Error(`--today must be YYYY-MM-DD, got ${given}`);
  return given ?? new Date().toISOString().slice(0, 10);
}

/** True when this module is the script node was asked to run. */
export function isMain(metaUrl) {
  return Boolean(process.argv[1]) && fileURLToPath(metaUrl) === resolve(process.argv[1]);
}
