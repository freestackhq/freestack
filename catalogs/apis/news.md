---
category: News
description: News aggregation and article search APIs
---

# News

## Comparison Matrix

| API | Auth | Free Tier | Rate Limit | CORS | Status |
|-----|------|-----------|------------|------|--------|
| [Hacker News](#hacker-news) | none | unlimited | fair use | ✓ | active |
| [NewsAPI](#newsapi) | api-key | 100 req/day (dev only) | 100 req/day | ✗ | active |
| [GNews](#gnews) | api-key | 100 req/day | 100 req/day | ✓ | active |

---

## Hacker News

| Field | Value |
|-------|-------|
| Base URL | https://hacker-news.firebaseio.com/v0 |
| Docs | https://github.com/HackerNews/API |
| Auth | none |
| Free Tier | unlimited, fully open |
| Rate Limit | fair use (Firebase-backed) |
| CORS | ✓ |
| Response | JSON |
| OpenAPI | ✗ |
| Status | active |

Official Hacker News API on Firebase. Get top/new/best stories, item details, user profiles, and live updates. No key needed, no rate limit published. Perfect for tech news aggregators.

**Pick this if** you want tech/startup news with zero auth and real-time capabilities.

**vs NewsAPI** — HN is free and unlimited but only tech/startup content; NewsAPI covers global news across all topics.

---

## NewsAPI

| Field | Value |
|-------|-------|
| Base URL | https://newsapi.org/v2 |
| Docs | https://newsapi.org/docs |
| Auth | api-key |
| Free Tier | 100 requests/day, development only (localhost) |
| Rate Limit | 100 req/day |
| CORS | ✗ (server-side only on free) |
| Response | JSON |
| OpenAPI | ✗ |
| Status | active |

Search 80,000+ news sources worldwide. Headlines, everything search, and source listing. **Major caveat:** free tier only works from localhost/development — production requires paid plan.

**Pick this if** you're prototyping a news aggregator locally and plan to upgrade for production.

**vs GNews** — Similar scope but NewsAPI has more sources; however GNews's free tier works in production while NewsAPI's does not.

---

## GNews

| Field | Value |
|-------|-------|
| Base URL | https://gnews.io/api/v4 |
| Docs | https://gnews.io/docs |
| Auth | api-key |
| Free Tier | 100 requests/day |
| Rate Limit | 100 req/day |
| CORS | ✓ |
| Response | JSON |
| OpenAPI | ✗ |
| Status | active |

Global news search and top headlines from Google News sources. Supports language/country filtering. Free tier works in production (unlike NewsAPI).

**Pick this if** you need a production-ready news API on the free tier with global coverage.

**vs NewsAPI** — Fewer sources but the free tier actually works in production; NewsAPI locks free to localhost only.
