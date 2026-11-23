#!/usr/bin/env node
/**
 * Renders the social card public/brand/og.png (1200x630) from scripts/brand/og.html.
 * The logo mark comes from public/brand/logo-mark.svg, so the card never drifts from it.
 * Needs the Playwright Chromium (`pnpm exec playwright install chromium`) and network for Archivo.
 *
 *   pnpm brand:og              write public/brand/og.png
 *   pnpm brand:og --out=x.png  write somewhere else (for review)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const out = process.argv.find((a) => a.startsWith("--out="))?.slice(6) ?? "public/brand/og.png";

// Inline the mark into the template, then screenshot at exactly 1x.
const mark = readFileSync(resolve(ROOT, "public/brand/logo-mark.svg"), "utf8").replace(
  'role="img" aria-label="freestack"',
  'aria-hidden="true"',
);
const html = readFileSync(resolve(ROOT, "scripts/brand/og.html"), "utf8").replace("<!-- LOGO_MARK -->", mark);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => document.fonts.check('900 124px "Archivo"'));
  if (!loaded) throw new Error("Archivo did not load; check the network and retry.");
  await page.screenshot({ path: resolve(ROOT, out), type: "png" });
  console.log(`wrote ${out}`);
} finally {
  await browser.close();
}
