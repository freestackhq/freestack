// @ts-check
import { defineConfig } from 'astro/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

// The domain is an env var, not code: SITE_URL in .env, CI or the deploy shell.
// A shell or CI value wins over .env (loadEnvFile never overwrites).
if (existsSync('.env')) process.loadEnvFile('.env');
const site = process.env.SITE_URL?.trim() || undefined;

// Test fixtures: FREESTACK_DATA=tests/fixtures/data builds the site from the
// fixture snapshot (see scripts/generate.mjs) instead of the committed one.
const fixtureData = process.env.FREESTACK_DATA?.trim();
const alias = fixtureData
  ? [{ find: /^.*\/data\/catalog\.generated\.json$/, replacement: resolve(fixtureData, '.generated/catalog.json') }]
  : [];

// https://astro.build/config
export default defineConfig({
  site,
  // A second build (the e2e real-data smoke run) can write elsewhere.
  outDir: process.env.ASTRO_OUT_DIR || './dist',
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias }
  },

  adapter: cloudflare()
});
