---
category: Observability
description: Logs, metrics, tracing, and error tracking.
order: 7
---

# Observability

## Comparison Matrix

| Service | Cost | Student | Commercial | Limits |
|---------|------|---------|------------|--------|
| [PostHog](#posthog) | free forever | anyone | commercial ok | ~1M events/mo · no CC for free caps |
| [Sentry](#sentry) | free forever | student helps | commercial ok | ~5k errors/mo public · Pack: ~50k + Team features |
| [Axiom](#axiom) | free forever | anyone | commercial ok | Generous free ingest (~500 GB/mo class) |
| [UptimeRobot](#uptimerobot) | free forever | anyone | commercial ok | 50 monitors |
| [Better Stack](#better-stack) | free forever | anyone | commercial ok | 10 uptime monitors · ~1 GB log ingest/mo · status page |
| [New Relic](#new-relic) | free forever | student helps | commercial ok | ~100 GB/mo ingest free · Pack may unlock more for students |

---

## PostHog

| Field | Value |
|-------|-------|
| URL | https://posthog.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | ~1M events/mo · no CC for free caps |

Product analytics, session replay, feature flags.

**Pick this if** you need product analytics (funnels, retention, paths) *and* session replay *and* feature flags in one SDK instead of stitching three vendors together. The ~1M events/mo free tier is real — no credit card, no trial expiry.

**vs Sentry** — Sentry catches crashes; PostHog tells you *why users churned before they crashed*. Use both: Sentry for errors, PostHog for behavior.
**vs Axiom** — Axiom is for structured backend logs; PostHog is for frontend product analytics. Different layers, not competitors.


---

## Sentry

| Field | Value |
|-------|-------|
| URL | https://sentry.io |
| Cost | free forever |
| Student | student helps |
| Commercial | commercial ok |
| Limits | ~5k errors/mo public · Pack: ~50k + Team features |

Error tracking with source maps. Boosted via Pack.

**Pick this if** your app ships JS/TS bundles and you need stack traces that point to *your* source lines, not minified garbage. The 5k errors/mo free tier covers side projects; the GitHub Student Pack bumps you to ~50k + Team features for serious staging environments.

**vs PostHog** — PostHog shows what users *did*; Sentry shows what *broke*. Install both — they complement, not compete.
**vs Better Stack** — Better Stack alerts you the endpoint is down; Sentry tells you the exact unhandled promise rejection on line 42 that caused it.


---

## Axiom

| Field | Value |
|-------|-------|
| URL | https://axiom.co |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Generous free ingest (~500 GB/mo class) |

Structured logs that don't melt your laptop.

**Pick this if** you want to `console.log` structured JSON from your backend and actually *query* it later without running Elasticsearch or paying Datadog prices. ~500 GB/mo free ingest is absurd — you won't hit it on a solo SaaS. Axiom's query language (APL) feels like KQL and returns in seconds.

**vs New Relic** — New Relic is a full APM with traces/metrics/dashboards; Axiom is a focused log-query engine that's faster to set up and won't nickel-and-dime on seats.
**vs Better Stack** — Better Stack bundles uptime + logs + status pages; Axiom gives you *far* more ingest headroom and a more powerful query language if logs are your primary concern.


---

## UptimeRobot

| Field | Value |
|-------|-------|
| URL | https://uptimerobot.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 50 monitors |

Know when the free PaaS fell asleep.

**Pick this if** you just want "is it up?" pings for up to 50 endpoints with email/Slack/webhook alerts — nothing more. Zero config, zero learning curve. Set it and forget it on day one; graduate to Better Stack when you need logs or a public status page.

**vs Better Stack** — Better Stack does uptime *plus* logs *plus* status pages, but UptimeRobot's free tier gives you 5× more monitors (50 vs 10). Start here if monitoring count matters more than features.
**vs New Relic** — New Relic Synthetics can ping URLs too, but it's a sledgehammer for a nail. UptimeRobot is the right tool when all you need is "ping and alert."


---

## Better Stack

| Field | Value |
|-------|-------|
| URL | https://betterstack.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 10 uptime monitors · ~1 GB log ingest/mo · status page |
| Tags | uptime |
| Verified | 2026-07-24 |

Uptime, incidents, and logs — cleaner next step after UptimeRobot.

**Pick this if** you want uptime monitoring + log ingestion + a public status page from a single vendor with a polished UI. The free tier (10 monitors, ~1 GB logs, status page) is the sweet spot when you outgrow UptimeRobot's ping-only model and want one dashboard for "what's down" and "why."

**vs UptimeRobot** — UptimeRobot has more free monitors (50 vs 10) but zero log support and no built-in status page. Better Stack is the upgrade path when you need *context* alongside alerts.
**vs Axiom** — Axiom wins on raw log volume (~500 GB vs ~1 GB free); Better Stack wins on the integrated incident workflow + status page. Pick by whether you need deep log queries or incident management.


---

## New Relic

| Field | Value |
|-------|-------|
| URL | https://newrelic.com |
| Cost | free forever |
| Student | student helps |
| Commercial | commercial ok |
| Limits | ~100 GB/mo ingest free · Pack may unlock more for students |
| Verified | 2026-07-24 |

Full-stack APM + logs with a forever free ingest bucket.

**Pick this if** you want distributed traces, APM dashboards, and logs in one platform with ~100 GB/mo free ingest — enough to observe a multi-service backend end-to-end. The Student Pack may unlock extra capacity. Best for when you've outgrown "just logs" and need flame graphs, service maps, and SLI/SLO tracking.

**vs Axiom** — Axiom is leaner and faster for pure log queries; New Relic is heavier but gives you traces, metrics, and dashboards you'd otherwise build yourself.
**vs Sentry** — Sentry is laser-focused on *errors*; New Relic gives you the full request lifecycle (latency, throughput, saturation) even when nothing is crashing.


---
