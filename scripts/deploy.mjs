#!/usr/bin/env node
/**
 * Build and deploy to Cloudflare Workers on the domain in SITE_URL.
 *
 *   SITE_URL=https://freestack.example.com pnpm deploy:cf
 *
 * The custom domain is passed to wrangler from SITE_URL, so wrangler.jsonc
 * holds no domain.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");
const raw = process.env.SITE_URL?.trim();
if (!raw) {
  console.error("deploy: set SITE_URL (e.g. https://freestack.example.com). See .env.example.");
  process.exit(1);
}
let host;
try {
  host = new URL(raw).hostname;
} catch {
  console.error(`deploy: SITE_URL is not a URL: ${raw}`);
  process.exit(1);
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: { ...process.env, SITE_URL: raw } });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run("pnpm", ["build"]);
const isLocal = host === "localhost" || host === "127.0.0.1";
run("pnpm", ["exec", "wrangler", "deploy", ...(isLocal ? [] : ["--domain", host])]);
