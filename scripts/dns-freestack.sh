#!/usr/bin/env bash
# Verify the custom domain in SITE_URL on the freestack worker.
#
# The domain is attached from the Cloudflare dashboard:
#   Workers & Pages → freestack → Settings → Domains & Routes → Add custom domain
# (wrangler OAuth cannot auto-provision it: the kuyacarlo.dev zone lives outside
#  the account the OAuth token belongs to.)
# `pnpm deploy:cf` passes the same domain to wrangler with --domain.
#
# Usage:
#   ./scripts/dns-freestack.sh

set -euo pipefail

if [[ -z "${SITE_URL:-}" && -f .env ]]; then SITE_URL="$(grep -E '^SITE_URL=' .env | cut -d= -f2-)"; fi
: "${SITE_URL:?set SITE_URL, e.g. https://freestack.example.com}"
DOMAIN="$(echo "$SITE_URL" | sed -E 's#^[a-z]+://##; s#[/:].*$##')"

echo "Checking ${DOMAIN}…"
echo "  CNAME:  $(dig +short "${DOMAIN}" CNAME || true)"
echo "  worker: $(dig +short "${DOMAIN}" A | head -1)"

echo
echo "Verify:"
echo "  Dashboard → Workers & Pages → freestack → Settings → Domains & Routes"
echo "  curl -s https://${DOMAIN}/api/health"
