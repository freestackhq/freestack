---
category: Finance
description: Forex, exchange rates, and financial data APIs with free tiers
---

# Finance

## Comparison Matrix

| API | Auth | Free Tier | Rate Limit | CORS | Status |
|-----|------|-----------|------------|------|--------|
| [Frankfurter](#frankfurter) | none | unlimited | fair use | ✓ | active |
| [ExchangeRate-API](#exchangerate-api) | none (open) | 1500 req/mo | fair use | ✓ | active |
| [Alpha Vantage](#alpha-vantage) | api-key | 25 req/day | 25 req/day | ✓ | active |

---

## Frankfurter

| Field | Value |
|-------|-------|
| Base URL | https://api.frankfurter.app |
| Docs | https://www.frankfurter.app/docs |
| Auth | none |
| Free Tier | unlimited, open source |
| Rate Limit | fair use (no hard limit published) |
| CORS | ✓ |
| Response | JSON |
| OpenAPI | ✗ |
| Status | active |

Foreign exchange rates published by the European Central Bank. Covers 30+ currencies. Historical data from 1999. Open-source, self-hostable, no key needed.

**Pick this if** you need reliable FX rates with zero auth, backed by ECB data, and you can self-host if needed.

**vs ExchangeRate-API** — Both are keyless but Frankfurter is open-source and self-hostable; ExchangeRate-API has more currencies (150+).

---

## ExchangeRate-API

| Field | Value |
|-------|-------|
| Base URL | https://open.er-api.com/v6 |
| Docs | https://www.exchangerate-api.com/docs |
| Auth | none (open endpoint) |
| Free Tier | 1500 requests/month on open endpoint |
| Rate Limit | fair use |
| CORS | ✓ |
| Response | JSON |
| OpenAPI | ✗ |
| Status | active |

Exchange rates for 150+ currencies. The open endpoint requires no key but refreshes daily. Paid tiers add more update frequency and pair conversion endpoints.

**Pick this if** you need more currencies than Frankfurter (150+ vs 30+) and daily refresh is fine.

**vs Frankfurter** — More currencies but not open-source; Frankfurter is ECB-sourced and self-hostable.

---

## Alpha Vantage

| Field | Value |
|-------|-------|
| Base URL | https://www.alphavantage.co/query |
| Docs | https://www.alphavantage.co/documentation/ |
| Auth | api-key |
| Free Tier | 25 requests/day |
| Rate Limit | 25 req/day (5 req/min) |
| CORS | ✓ |
| Response | JSON, CSV |
| OpenAPI | ✗ |
| Status | active |

Stock prices, forex, crypto, technical indicators, and fundamental data (earnings, balance sheets). The free tier is very limited (25/day) but covers a wide surface area of financial data.

**Pick this if** you need stock market or technical indicator data and can live with 25 calls/day for prototyping.

**vs Frankfurter** — Different scope; Alpha Vantage does stocks + indicators + fundamentals; Frankfurter is FX-only but unlimited.
