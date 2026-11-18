#!/usr/bin/env node
/**
 * Build and deploy to Cloudflare Workers on the domain in SITE_URL.
 *
 *   SITE_URL=https://freestack.example.com pnpm deploy:cf
 *
 * The custom domain is passed to wrangler from SITE_URL, so wrangler.jsonc
 * holds no domain.
 *
 * The deploy also captures the Worker's own *.workers.dev URL from wrangler's
 * output. CI smoke-tests that URL instead of the custom domain: the zone's
 * Bot Fight Mode blocks GitHub Actions runner IPs on the custom domain
 * (returning 403), but the workers.dev route sits in front of the Worker
 * directly and is not behind the zone's bot protection. The URL is printed
 * with a stable marker and, under GitHub Actions, written to GITHUB_OUTPUT.
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync } from "node:fs";

// The first https://<something>.workers.dev URL wrangler prints is the route
// for this Worker. Exported (pure, no side effects) so it can be unit-tested.
export function extractWorkersDevUrl(output) {
  const m = String(output).match(/https:\/\/[a-z0-9][a-z0-9.-]*\.workers\.dev\b/i);
  return m ? m[0] : null;
}

function run(cmd, args, env) {
  const r = spawnSync(cmd, args, { stdio: "inherit", env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// Run wrangler with stdout captured (and still shown) so we can read back the
// deployed workers.dev URL. Returns the captured stdout text.
function runCapture(cmd, args, env) {
  const r = spawnSync(cmd, args, {
    env,
    encoding: "utf8",
    // stdin inherited; stdout captured; stderr inherited so warnings/errors show live.
    stdio: ["inherit", "pipe", "inherit"],
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.status !== 0) process.exit(r.status ?? 1);
  return r.stdout ?? "";
}

function main() {
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

  // Not fatal: without it, /contact and /privacy point to GitHub issues only.
  if (!process.env.PUBLIC_CONTACT_EMAIL?.trim()) {
    console.warn("deploy: PUBLIC_CONTACT_EMAIL is unset, so the site shows no support address. See .env.example.");
  }

  const env = { ...process.env, SITE_URL: raw };
  run("pnpm", ["build"], env);
  const isLocal = host === "localhost" || host === "127.0.0.1";
  const out = runCapture("pnpm", ["exec", "wrangler", "deploy", ...(isLocal ? [] : ["--domain", host])], env);

  const workersDevUrl = extractWorkersDevUrl(out);
  if (workersDevUrl) {
    // Stable marker for logs and for anything scraping stdout.
    console.log(`deploy: workers.dev URL = ${workersDevUrl}`);
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `workers_dev_url=${workersDevUrl}\n`);
    }
  } else {
    // Not fatal: the deploy itself succeeded. The smoke test falls back to the
    // custom domain if no workers.dev URL was captured.
    console.warn("deploy: could not find a *.workers.dev URL in wrangler output");
  }
}

// Only run when invoked directly (not when imported by a test).
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main();
}
