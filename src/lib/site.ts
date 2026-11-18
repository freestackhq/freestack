/**
 * The site's public address and source repo, from the environment.
 *
 * SITE_URL is the one place the domain lives (see .env.example). Astro reads
 * it into `site` at build time, so pages, share links, llms.txt, the API docs
 * and the MCP address all follow it. Unset, it falls back to the local
 * preview address so tests and dev builds still work.
 */
const FALLBACK_SITE = "http://localhost:4321";

export const SITE_URL: string = String(import.meta.env.SITE ?? FALLBACK_SITE).replace(/\/+$/, "");

/** True when SITE_URL was set for this build (production deploys require it). */
export const SITE_IS_SET: boolean = Boolean(import.meta.env.SITE);

/** owner/name of the GitHub repo that holds the data and takes issues. */
export const GITHUB_REPO: string = String(import.meta.env.PUBLIC_GITHUB_REPO || "freestackhq/freestack");

export const REPO_URL = `https://github.com/${GITHUB_REPO}`;

/** Absolute URL on this site for a path like "/compare?ids=neon". */
export function siteUrl(path = "/"): string {
  return new URL(path.replace(/^\/*/, "/"), SITE_URL + "/").toString();
}

/**
 * The support address from PUBLIC_CONTACT_EMAIL, or null. Pages never make one
 * up: unset (or not an address), Contact and Privacy point to GitHub only.
 */
export function contactEmail(raw: string | undefined | null): string | null {
  const v = String(raw ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}

export const CONTACT_EMAIL: string | null = contactEmail(import.meta.env.PUBLIC_CONTACT_EMAIL);

/** The remote MCP server's address. */
export const MCP_URL = siteUrl("/mcp");
