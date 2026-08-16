#!/usr/bin/env bash
# Verify the freestack.kuyacarlo.dev custom domain on the freestack worker.
#
# The domain is attached from the Cloudflare dashboard:
#   Workers & Pages → freestack → Settings → Domains & Routes → Add custom domain
# (wrangler OAuth cannot auto-provision it: the kuyacarlo.dev zone lives outside
#  the account the OAuth token belongs to.)
#
# Usage:
#   ./scripts/dns-freestack.sh

set -euo pipefail

DOMAIN="${DOMAIN:-freestack.kuyacarlo.dev}"

echo "Checking ${DOMAIN}…"
echo "  CNAME:  $(dig +short "${DOMAIN}" CNAME || true)"
echo "  worker: $(dig +short "${DOMAIN}" A | head -1)"

echo
echo "Verify:"
echo "  Dashboard → Workers & Pages → freestack → Settings → Domains & Routes"
echo "  curl -s https://${DOMAIN}/api/health"
