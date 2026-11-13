#!/usr/bin/env node
/**
 * Write the Claude Code plugin marketplace from SITE_URL.
 *
 *   SITE_URL=https://your.domain pnpm plugin:build          # write the files
 *   SITE_URL=https://your.domain pnpm plugin:build --check  # fail if they drift
 *
 * A plugin's .mcp.json and skill can't read our env var at install time, so
 * the marketplace copy holds the real address and must be regenerated (and
 * committed) whenever SITE_URL changes. It writes:
 *   .claude-plugin/marketplace.json
 *   plugins/freestack/.claude-plugin/plugin.json
 *   plugins/freestack/.mcp.json                      (the remote MCP server)
 *   plugins/freestack/skills/pick-free-stack/SKILL.md (filled from skills/)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fillSkill } from "./skill-fill.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");

if (existsSync(join(ROOT, ".env"))) process.loadEnvFile(join(ROOT, ".env"));
const raw = process.env.SITE_URL?.trim();
if (!raw) {
  console.error("build-plugin: set SITE_URL (e.g. https://freestack.example.com). See .env.example.");
  process.exit(1);
}
let site;
try {
  site = new URL(raw).origin;
} catch {
  console.error(`build-plugin: SITE_URL is not a URL: ${raw}`);
  process.exit(1);
}
const repo = process.env.PUBLIC_GITHUB_REPO?.trim() || "freestackhq/freestack";
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const description = "Check free-tier labels (limits, catches, can you sell, card needed) before your agent adds anything paid.";

const json = (v) => `${JSON.stringify(v, null, 2)}\n`;
const files = {
  ".claude-plugin/marketplace.json": json({
    name: "freestack",
    description: "freestack: free tiers as shelf labels, for coding agents.",
    owner: { name: "freestack", url: `https://github.com/${repo}` },
    plugins: [{ name: "freestack", source: "./plugins/freestack", description }],
  }),
  "plugins/freestack/.claude-plugin/plugin.json": json({
    name: "freestack",
    description,
    version: pkg.version,
    author: { name: "freestack", url: `https://github.com/${repo}` },
    homepage: `${site}/agents`,
    repository: `https://github.com/${repo}`,
    license: "MIT",
    keywords: ["free tier", "stack", "hosting", "database", "mcp"],
  }),
  "plugins/freestack/.mcp.json": json({ mcpServers: { freestack: { type: "http", url: `${site}/mcp` } } }),
  "plugins/freestack/skills/pick-free-stack/SKILL.md": fillSkill(readFileSync(join(ROOT, "skills/pick-free-stack/SKILL.md"), "utf8"), site),
};

let stale = 0;
for (const [path, content] of Object.entries(files)) {
  const abs = join(ROOT, path);
  const current = existsSync(abs) ? readFileSync(abs, "utf8") : null;
  if (current === content) continue;
  if (check) {
    console.error(`build-plugin: ${path} is out of date for SITE_URL=${site}`);
    stale++;
    continue;
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  console.log(`build-plugin: wrote ${path}`);
}
if (stale) {
  console.error("build-plugin: run `pnpm plugin:build` with the same SITE_URL and commit the result.");
  process.exit(1);
}
if (check) console.log(`build-plugin: plugin files match ${site}`);
