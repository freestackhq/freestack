/** "https://www.neon.tech/pricing/" -> "neon.tech/pricing". Falls back to the input. */
export function shortUrl(href: string): string {
  try {
    const u = new URL(href);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return href;
  }
}
