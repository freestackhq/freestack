#!/usr/bin/env node
/**
 * pre-commit: data/, schema/, label.ts or generate.mjs is staged, so rebuild
 * the catalog snapshot and fail if it changed but isn't staged.
 *
 * It never stages the snapshot itself: the generator reads the working tree,
 * so with a partly staged data edit the output would not match the commit.
 */
import { execFileSync } from "node:child_process";

const OUTPUTS = ["src/data/catalog.generated.json", "src/data/rules.generated.json"];

// Fails loudly (and stops the commit) on schema errors or unknown ids.
execFileSync("node", ["scripts/generate.mjs"], { stdio: ["ignore", "ignore", "inherit"] });

const unstaged = execFileSync("git", ["diff", "--name-only", "--", ...OUTPUTS], { encoding: "utf8" }).trim();
if (unstaged) {
  console.error(
    [
      "catalog: the generated snapshot changed but isn't staged:",
      ...unstaged.split("\n").map((f) => `  ${f}`),
      "Review it, then stage it: git add src/data/*.generated.json",
    ].join("\n"),
  );
  process.exit(1);
}
