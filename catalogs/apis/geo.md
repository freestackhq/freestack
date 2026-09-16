---
category: Geolocation
description: IP geolocation, geocoding, and mapping APIs
---

# Geolocation

## Comparison Matrix

| API | Auth | Free Tier | Rate Limit | CORS | Status |
|-----|------|-----------|------------|------|--------|
| [ip-api](#ip-api) | none | unlimited (non-commercial) | 45 req/min | ✗ (http only) | active |
| [Nominatim](#nominatim) | none | unlimited (fair use) | 1 req/sec | ✓ | active |
| [ipinfo.io](#ipinfoio) | none (token optional) | 50k req/mo | 1000 req/day (no token) | ✓ | active |

---

## ip-api

| Field | Value |
|-------|-------|
| Base URL | http://ip-api.com/json |
| Docs | https://ip-api.com/docs |
| Auth | none |
| Free Tier | unlimited for non-commercial use |
| Rate Limit | 45 req/min |
| CORS | ✗ (HTTP only on free tier, no HTTPS) |
| Response | JSON, CSV, XML |
| OpenAPI | ✗ |
| Status | active |

IP geolocation returning country, region, city, lat/long, ISP, timezone. Fast and no signup. Caveat: free tier is HTTP-only (no TLS), so not suitable for client-side browser calls.

**Pick this if** you need server-side IP geolocation with no key and don't care about HTTPS on the free tier.

**vs ipinfo.io** — ip-api is simpler and no signup, but HTTP-only on free. ipinfo gives HTTPS and ASN data but has a monthly cap.

---

## Nominatim

| Field | Value |
|-------|-------|
| Base URL | https://nominatim.openstreetmap.org |
| Docs | https://nominatim.org/release-docs/latest/ |
| Auth | none |
| Free Tier | unlimited (respect usage policy) |
| Rate Limit | 1 req/sec (absolute max) |
| CORS | ✓ |
| Response | JSON, XML |
| OpenAPI | ✗ |
| Status | active |

Geocoding (address → coordinates) and reverse geocoding (coordinates → address) powered by OpenStreetMap data. Self-hostable. The public instance has strict rate limits but is completely free.

**Pick this if** you need geocoding/reverse geocoding backed by OSM data and can self-host for higher throughput.

**vs ipinfo.io** — Different purpose. Nominatim does address/coordinate lookup; ipinfo does IP-based geolocation.

---

## ipinfo.io

| Field | Value |
|-------|-------|
| Base URL | https://ipinfo.io |
| Docs | https://ipinfo.io/developers |
| Auth | none (token for higher limits) |
| Free Tier | 50,000 requests/month |
| Rate Limit | 1000 req/day without token |
| CORS | ✓ |
| Response | JSON |
| OpenAPI | ✗ |
| Status | active |

IP geolocation plus ASN, company, privacy detection (VPN/proxy/tor), and carrier data. Free tier is generous and works over HTTPS. Token unlocks 50k/mo.

**Pick this if** you want HTTPS IP geolocation with ASN/company info and don't mind getting a free token for higher limits.

**vs ip-api** — ipinfo has HTTPS, ASN data, and privacy detection; ip-api is simpler but HTTP-only on free.
