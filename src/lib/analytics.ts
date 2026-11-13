/**
 * Cloudflare Web Analytics beacon (free, no cookies). Only rendered when
 * PUBLIC_CF_ANALYTICS_TOKEN is set at build time; empty ships nothing.
 */
export const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

export interface Beacon {
  src: string;
  /** Value for the script's data-cf-beacon attribute. */
  config: string;
}

export function analyticsBeacon(token: string | undefined | null): Beacon | null {
  const t = String(token ?? "").trim();
  if (!t) return null;
  return { src: BEACON_SRC, config: JSON.stringify({ token: t }) };
}
