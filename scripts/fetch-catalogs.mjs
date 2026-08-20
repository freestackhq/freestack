#!/usr/bin/env node
/** Clone or update the catalog repos configured in catalogs.config.mjs into .catalogs/ */
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { catalogs } from "../catalogs.config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const store = join(root, ".catalogs");
mkdirSync(store, { recursive: true });

for (const c of catalogs) {
  const dest = join(store, `${c.owner}-${c.repo}`);
  const url = `https://github.com/${c.owner}/${c.repo}.git`;
  const branch = c.branch ?? "main";
  if (existsSync(join(dest, ".git"))) {
    console.log(`updating ${c.id} (${url})…`);
    execFileSync("git", ["-C", dest, "fetch", "origin"], { stdio: "inherit" });
    execFileSync("git", ["-C", dest, "checkout", "-q", branch], { stdio: "inherit" });
    execFileSync("git", ["-C", dest, "pull", "--ff-only", "-q", "origin", branch], {
      stdio: "inherit",
    });
  } else {
    console.log(`cloning ${c.id} (${url})…`);
    try {
      execFileSync(["git", "clone", "--depth", "1", "--branch", branch, url, dest].join(" "), {
        stdio: "inherit",
        shell: true,
      });
    } catch {
      console.warn(`  ! could not clone ${url} — skipping (repo may not exist yet)`);
      continue;
    }
  }
}
console.log("done");