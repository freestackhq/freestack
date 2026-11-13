#!/usr/bin/env node
/**
 * Playwright's webServer. Builds the site twice and serves both:
 *
 *   PORT       fixture build (tests/fixtures/data) behind `astro preview`.
 *              The fresh/*, api and redirect specs run here, so every label
 *              state exists no matter what the real data looks like.
 *   REAL_PORT  real build (data/), prerendered pages only, from a tiny
 *              static server. The real-data smoke spec runs here.
 *
 * Builds run one after another (two Astro builds at once share caches).
 * The fixture snapshot goes to tests/fixtures/data/.generated/, so the
 * committed src/data/catalog.generated.json is never touched.
 */
import { spawnSync } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const PORT = process.env.PORT ?? "4321";
const REAL_PORT = process.env.REAL_PORT ?? String(Number(PORT) + 1);
const FIXTURES = "tests/fixtures/data";
const REAL_OUT = "dist-real";

function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: { ...process.env, ...env } });
  if (r.status !== 0) {
    console.error(`e2e-server: ${cmd} ${args.join(" ")} failed`);
    process.exit(r.status ?? 1);
  }
}

// 1. Fixture snapshot + build (dist/).
run("node", ["scripts/generate.mjs"], { FREESTACK_DATA: FIXTURES });
run("pnpm", ["astro", "build"], { FREESTACK_DATA: FIXTURES, ASTRO_OUT_DIR: "" });

// 2. Real build (dist-real/), from the committed snapshot.
const realEnv = { ...process.env, ASTRO_OUT_DIR: REAL_OUT };
delete realEnv.FREESTACK_DATA;
const real = spawnSync("pnpm", ["astro", "build"], { stdio: "inherit", env: realEnv });
if (real.status !== 0) process.exit(real.status ?? 1);

// 3. Fixture site on PORT (astro preview daemonizes; wait for it).
spawnSync("pnpm", ["astro", "preview", "--port", PORT], { stdio: "inherit", env: { ...process.env, ASTRO_OUT_DIR: "" } });
const deadline = Date.now() + 90_000;
while (Date.now() < deadline) {
  try {
    if ((await fetch(`http://127.0.0.1:${PORT}/api/health`)).ok) break;
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 500));
}

// 4. Real prerendered pages on REAL_PORT.
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain", ".png": "image/png", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };
const base = join(process.cwd(), REAL_OUT, "client");
createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (path === "/__ready") return res.end("ok");
  for (const file of [join(base, path), join(base, path, "index.html")]) {
    if (file.startsWith(base) && existsSync(file) && statSync(file).isFile()) {
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      return createReadStream(file).pipe(res);
    }
  }
  res.writeHead(404).end("not found");
}).listen(Number(REAL_PORT), () => console.log(`e2e-server: fixture site on :${PORT}, real pages on :${REAL_PORT}`));

const stop = () => {
  spawnSync("pnpm", ["astro", "preview", "stop"], { stdio: "inherit" });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
