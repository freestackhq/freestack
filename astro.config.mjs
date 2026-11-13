// @ts-check
import { defineConfig } from 'astro/config';
import { existsSync } from 'node:fs';

import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

// The domain is an env var, not code: SITE_URL in .env, CI or the deploy shell.
// A shell or CI value wins over .env (loadEnvFile never overwrites).
if (existsSync('.env')) process.loadEnvFile('.env');
const site = process.env.SITE_URL?.trim() || undefined;

// https://astro.build/config
export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()]
  },

  adapter: cloudflare()
});
