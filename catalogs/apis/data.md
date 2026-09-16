---
category: Data
description: General knowledge, reference, and open data APIs
---

# Data

## Comparison Matrix

| API | Auth | Free Tier | Rate Limit | CORS | Status |
|-----|------|-----------|------------|------|--------|
| [REST Countries](#rest-countries) | none | unlimited | fair use | ✓ | active |
| [Wikipedia REST](#wikipedia-rest) | none | unlimited | fair use | ✓ | active |
| [Open Library](#open-library) | none | unlimited | 100 req/5min (search) | ✓ | active |

---

## REST Countries

| Field | Value |
|-------|-------|
| Base URL | https://restcountries.com/v3.1 |
| Docs | https://restcountries.com |
| Auth | none |
| Free Tier | unlimited, open source |
| Rate Limit | fair use (no hard limit) |
| CORS | ✓ |
| Response | JSON |
| OpenAPI | ✗ |
| Status | active |

Country data: name, capital, population, area, currencies, languages, timezones, borders, flags (SVG/PNG). Filter by region, subregion, language, currency.

**Pick this if** you need country metadata (flags, currencies, capitals) for dropdowns, forms, or reference data.

**vs Wikipedia REST** — REST Countries is structured data for country facts; Wikipedia is prose/articles for general knowledge.

---

## Wikipedia REST

| Field | Value |
|-------|-------|
| Base URL | https://en.wikipedia.org/api/rest_v1 |
| Docs | https://en.wikipedia.org/api/rest_v1/ |
| Auth | none |
| Free Tier | unlimited (follow User-Agent policy) |
| Rate Limit | fair use (set a User-Agent) |
| CORS | ✓ |
| Response | JSON, HTML |
| OpenAPI | ✓ |
| Status | active |

Wikipedia content via REST: page summaries, full HTML, media, on-this-day, featured content, and random articles. Set a descriptive User-Agent header per Wikimedia policy.

**Pick this if** you need general knowledge summaries, random facts, or "on this day" content for apps.

**vs REST Countries** — Different scope. Wikipedia is general knowledge; REST Countries is structured country metadata.

---

## Open Library

| Field | Value |
|-------|-------|
| Base URL | https://openlibrary.org |
| Docs | https://openlibrary.org/developers/api |
| Auth | none |
| Free Tier | unlimited |
| Rate Limit | 100 requests per 5 minutes (search); generous for direct lookups |
| CORS | ✓ |
| Response | JSON |
| OpenAPI | ✗ |
| Status | active |

Book data from the Internet Archive: search by title/author/ISBN, get cover images, edition info, author bios. Over 20M edition records. Self-hostable (open source).

**Pick this if** you need book metadata, covers, or ISBN lookups without paying for a proprietary book API.

**vs REST Countries** — Different domain entirely. Open Library is books; REST Countries is geographic data.
