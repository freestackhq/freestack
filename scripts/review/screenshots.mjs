#!/usr/bin/env node
/**
 * Screenshot review (issue 7.2): every route and state in docs/SCREENS.md, at
 * 1440px and 390px, from the fixture build and the real build, next to the
 * matching board from design/fresh/. Writes review/shots/ and review/index.html
 * (both gitignored).
 *
 *   pnpm review:shots                 build both sites, serve, shoot, write index
 *   pnpm review:shots --no-build      reuse dist/ and dist-real/
 *   pnpm review:shots --only=aisle    only captures whose id contains "aisle"
 *   pnpm review:shots --no-boards     skip the boards
 *
 * Both builds are served by `wrangler dev` (so on-demand pages like Home,
 * Compare, Add, 404 and the 500 page work for real data too) on REVIEW_PORT
 * (fixture, default 4431) and REVIEW_PORT+1 (real).
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { CAPTURES, BOARDS } from "./captures.mjs";

const ROOT = process.cwd();
const OUT = join(ROOT, "review");
const SHOTS = join(OUT, "shots");
const SCRATCH = join(OUT, ".tmp");
const FIXTURES = "tests/fixtures/data";
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const only = args.find((a) => a.startsWith("--only="))?.slice(7);
const PORT = Number(process.env.REVIEW_PORT ?? 4431);
const SITES = {
  fixture: { dir: "dist", port: PORT },
  real: { dir: "dist-real", port: PORT + 1 },
};
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };

function run(cmd, cmdArgs, env) {
  const r = spawnSync(cmd, cmdArgs, { stdio: "inherit", env });
  if (r.status !== 0) throw new Error(`${cmd} ${cmdArgs.join(" ")} failed`);
}

// Same two builds as scripts/e2e-server.mjs: real to dist-real/, fixtures to dist/.
function build() {
  const realEnv = { ...process.env, ASTRO_OUT_DIR: SITES.real.dir };
  delete realEnv.FREESTACK_DATA;
  run("pnpm", ["astro", "build"], realEnv);
  run("node", ["scripts/generate.mjs"], { ...process.env, FREESTACK_DATA: FIXTURES });
  run("pnpm", ["astro", "build"], { ...process.env, FREESTACK_DATA: FIXTURES, ASTRO_OUT_DIR: "" });
}

// Serve one build with wrangler dev and wait until it answers.
async function serve(name, { dir, port }) {
  const child = spawn(
    "pnpm",
    ["exec", "wrangler", "dev", "--config", `${dir}/server/wrangler.json`, "--ip", "127.0.0.1", "--port", String(port),
      "--inspector-port", String(port + 100), "--persist-to", join(SCRATCH, `state-${name}`), "--log-level", "warn"],
    { stdio: ["ignore", "inherit", "inherit"], detached: true },
  );
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) return child;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${name} site did not answer on :${port}`);
}

// Boards need their template runtime: turn <sc-*> into <template> and add the shim.
function prepareBoards() {
  const dest = join(SCRATCH, "boards");
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  const shim = readFileSync(join(ROOT, "scripts/review/board-shim.js"), "utf8");
  for (const f of readdirSync(join(ROOT, "design/fresh")).filter((f) => f.endsWith(".dc.html"))) {
    const html = readFileSync(join(ROOT, "design/fresh", f), "utf8")
      .replace('<script src="./support.js"></script>', `<style>x-dc{display:block}helmet{display:none}</style><script>${shim}</script>`)
      .replace(/<sc-(for|if)\b/g, "<template data-sc-$1")
      .replace(/<\/sc-(for|if)>/g, "</template>");
    writeFileSync(join(dest, f), html);
  }
  return dest;
}

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

async function shootBoards(browser) {
  const dir = prepareBoards();
  mkdirSync(join(SHOTS, "boards"), { recursive: true });
  for (const [board, vp] of BOARDS) {
    const page = await browser.newPage({ viewport: VIEWPORTS[vp] });
    await page.goto(`file://${join(dir, board)}.dc.html`);
    await page.waitForSelector("html[data-board-ready]", { timeout: 10_000 }).catch(() => {});
    await settle(page);
    await page.screenshot({ path: join(SHOTS, "boards", `${board}.${vp}.png`), fullPage: vp === "desktop" });
    await page.close();
    console.log(`board ${board} ${vp}`);
  }
}

async function shootSite(browser, site, { port }) {
  const results = [];
  mkdirSync(join(SHOTS, site), { recursive: true });
  for (const c of CAPTURES) {
    if (only && !c.id.includes(only)) continue;
    if (c.builds && !c.builds.includes(site)) continue;
    for (const vp of c.viewports ?? ["desktop", "phone"]) {
      const context = await browser.newContext({ viewport: VIEWPORTS[vp], baseURL: `http://127.0.0.1:${port}` });
      const page = await context.newPage();
      const file = `${site}/${c.id}.${vp}.png`;
      const entry = { id: c.id, site, vp, file, ok: true };
      try {
        const path = typeof c.path === "function" ? c.path(site) : c.path;
        if (c.before) await c.before(page);
        const res = await page.goto(path, { waitUntil: c.waitUntil ?? "load" });
        entry.status = res?.status();
        await settle(page);
        if (c.act) await c.act(page, vp, site);
        await settle(page);
        // Side scroll check, the most common phone breakage.
        entry.overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        await page.screenshot({ path: join(SHOTS, file), fullPage: !c.overlay });
      } catch (err) {
        entry.ok = false;
        entry.error = String(err.message ?? err).split("\n")[0];
        await page.screenshot({ path: join(SHOTS, file) }).catch(() => {});
      }
      results.push(entry);
      console.log(`${site} ${c.id} ${vp}${entry.ok ? "" : ` FAILED: ${entry.error}`}${entry.overflow > 0 ? ` overflow ${entry.overflow}px` : ""}`);
      await context.close();
    }
  }
  return results;
}

// One section per capture: desktop row and phone row, fixture | real | board.
function writeIndex(results) {
  const by = new Map(results.map((r) => [`${r.site}/${r.id}.${r.vp}`, r]));
  const cell = (title, src, note = "") =>
    `<figure><figcaption>${title}${note}</figcaption>${src ? `<a href="${src}"><img loading="lazy" src="${src}" alt="${title}"></a>` : "<p class=none>none</p>"}</figure>`;
  const shot = (site, c, vp) => {
    const r = by.get(`${site}/${c.id}.${vp}`);
    if (!r) return cell(site, null);
    const notes = [r.status && r.status !== 200 ? `HTTP ${r.status}` : "", r.overflow > 0 ? `side scroll ${r.overflow}px` : "", r.ok ? "" : `failed: ${r.error}`]
      .filter(Boolean)
      .map((n) => ` <b>${n}</b>`)
      .join("");
    return cell(site, `shots/${r.file}`, notes);
  };
  const sections = CAPTURES.filter((c) => !only || c.id.includes(only)).map((c) => {
    const rows = (c.viewports ?? ["desktop", "phone"]).map((vp) => {
      // Pages that reflow have no phone board: show the desktop one.
      const board = c.boards?.[vp];
      const bvp = BOARDS.some(([b, v]) => b === board && v === vp) ? vp : "desktop";
      const label = `board: ${board}${bvp !== vp ? " (desktop, reflows)" : ""}`;
      const boardCell = board ? cell(label, `shots/boards/${board}.${bvp}.png`) : cell("board", null);
      return `<h3>${vp === "desktop" ? "1440px" : "390px"}</h3><div class="row ${vp}">${shot("fixture", c, vp)}${shot("real", c, vp)}${boardCell}</div>`;
    });
    return `<section id="${c.id}"><h2>${c.title} <code>${typeof c.path === "function" ? c.path("real") : c.path}</code></h2>${c.note ? `<p>${c.note}</p>` : ""}${rows.join("")}</section>`;
  });
  const toc = CAPTURES.filter((c) => !only || c.id.includes(only)).map((c) => `<a href="#${c.id}">${c.title}</a>`).join("");
  writeFileSync(
    join(OUT, "index.html"),
    `<!doctype html><meta charset="utf-8"><title>Screenshot review</title>
<style>
body{font:14px/1.4 system-ui,sans-serif;margin:0;background:#E7E9EC;color:#1C2340}
nav{position:sticky;top:0;background:#1C2340;padding:8px 16px;display:flex;flex-wrap:wrap;gap:4px 12px;z-index:1}
nav a{color:#fff}section{padding:8px 16px 24px;border-bottom:2px solid #C9CDD4}
.row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start}
.row.phone{grid-template-columns:repeat(3,minmax(0,390px))}
figure{margin:0;background:#fff;padding:6px}figcaption{font-weight:600;margin-bottom:4px}
img{width:100%;display:block;border:1px solid #C9CDD4}b{color:#B3261E}.none{color:#545B73}
</style>
<nav>${toc}</nav>${sections.join("\n")}`,
  );
}

const children = [];
const stop = () => children.forEach((c) => { try { process.kill(-c.pid); } catch { /* gone */ } });
process.on("SIGINT", () => { stop(); process.exit(130); });

try {
  if (!flag("no-build")) build();
  mkdirSync(SCRATCH, { recursive: true });
  for (const [name, site] of Object.entries(SITES)) {
    if (!existsSync(resolve(site.dir, "server/wrangler.json"))) throw new Error(`${site.dir}/ is missing; run without --no-build`);
    children.push(await serve(name, site));
  }
  const browser = await chromium.launch();
  if (!flag("no-boards") && !only) await shootBoards(browser);
  const results = [];
  for (const [name, site] of Object.entries(SITES)) results.push(...(await shootSite(browser, name, site)));
  await browser.close();
  writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
  writeIndex(results);
  const failed = results.filter((r) => !r.ok || r.overflow > 0);
  console.log(`\n${results.length} screenshots, ${failed.length} with problems. Open review/index.html`);
  for (const f of failed) console.log(`  ${f.site} ${f.id} ${f.vp}: ${f.error ?? `side scroll ${f.overflow}px`}`);
} finally {
  stop();
}
