#!/usr/bin/env node
/**
 * pre-commit: block .env files and obvious secrets in the staged files.
 * Reads the staged content (git show :path), not the working tree.
 */
import { execFileSync } from "node:child_process";
import { basename } from "node:path";

// A real value, not a docs mention such as "CLOUDFLARE_API_TOKEN=" or a ${{ secrets.X }} reference.
const SECRETS = [
  [/CLOUDFLARE_API_TOKEN\s*=\s*["']?[A-Za-z0-9_-]{20,}/, "a Cloudflare API token"],
  [/\bghp_[A-Za-z0-9]{30,}/, "a GitHub token (ghp_)"],
  [/\bgithub_pat_[A-Za-z0-9_]{30,}/, "a GitHub token (github_pat_)"],
];

const problems = [];
for (const file of process.argv.slice(2)) {
  const name = basename(file);
  if (name === ".env" || (name.startsWith(".env.") && name !== ".env.example")) {
    problems.push(`${file}: .env files hold local secrets and are never committed`);
    continue;
  }
  let text;
  try {
    text = execFileSync("git", ["show", `:${file}`], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch {
    continue; // deleted or not a blob
  }
  if (text.includes("\0")) continue; // binary
  for (const [re, what] of SECRETS) if (re.test(text)) problems.push(`${file}: looks like ${what}`);
}

if (problems.length) {
  console.error(["secrets: refusing to commit", ...problems.map((p) => `  ${p}`)].join("\n"));
  console.error("Unstage the file (git restore --staged <file>) and move the value to .env or a CI secret.");
  process.exit(1);
}
