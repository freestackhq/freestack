---
category: Niche gems
description: Niche gems worth knowing.
order: 17
---

# Niche gems

## Comparison Matrix

| Service | Cost | Student | Commercial | Limits |
|---------|------|---------|------------|--------|
| [MotherDuck](#motherduck) | free forever | anyone | commercial ok | ~10 GB |
| [Val Town](#val-town) | free forever | anyone | check ToS | Free tier vals |
| [LiveKit Cloud](#livekit-cloud) | free forever | anyone | commercial ok | Free A/V minutes |
| [Tinybird](#tinybird) | free forever | anyone | commercial ok | Free starter tier |
| [Svix](#svix) | free forever | anyone | commercial ok | ~50k messages/mo |
| [Dub.co](#dubco) | free forever | anyone | commercial ok | Free plan |
| [Hugging Face Spaces](#hugging-face-spaces) | free forever | anyone | commercial ok | Free CPU · limited inference |
| [Cron-job.org](#cron-joborg) | free forever | anyone | commercial ok | Free external cron jobs |
| [Zyte Scrapy Cloud (Pack)](#zyte-scrapy-cloud-pack) | student free | student required | commercial ok | 1 unit forever · 120d retention |

---

## MotherDuck

| Field | Value |
|-------|-------|
| URL | https://motherduck.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | ~10 GB |

DuckDB in the cloud — analytics without a warehouse.

**Pick this if** you have ~1–10 GB of CSVs/Parquet and want SQL analytics without provisioning Postgres, BigQuery, or Snowflake. Local DuckDB + cloud sync means you develop on your laptop and share dashboards without infra.

**vs Supabase (for analytics):** MotherDuck is columnar and designed for analytical queries on flat files; Supabase/Postgres is row-oriented and better for CRUD apps. Don't use Postgres for 5GB event aggregations.
**vs BigQuery free tier:** BigQuery gives 1TB/mo query but has cold-start latency and requires GCP. MotherDuck is instant, local-first, and the free 10GB is actual storage not just query volume.


---

## Val Town

| Field | Value |
|-------|-------|
| URL | https://www.val.town |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | Free tier vals |

Serverless JS as shareable vals — cron + HTTP.

**Pick this if** you need a quick API endpoint, cron job, or webhook handler and don't want to set up a repo, deploy pipeline, or hosting. Each "val" is a self-contained function with a URL — perfect for glue code, bots, and prototypes.

**vs Cloudflare Workers:** Workers are production-grade with KV/D1/R2 bindings; Val Town is for quick-and-dirty scripts you write in a browser tab. Use Workers for real apps, Val Town for "I need this webhook in 2 minutes."
**vs GitHub Actions (scheduled):** Val Town runs on its own infra with HTTP endpoints; Actions require a repo and are slower to iterate on for simple cron tasks.


---

## LiveKit Cloud

| Field | Value |
|-------|-------|
| URL | https://livekit.io |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free A/V minutes |

WebRTC SFU for voice/video without Coturn ops.

**Pick this if** you're building a real-time voice/video feature (classroom, telehealth, multiplayer voice chat) and refuse to run your own TURN/STUN/SFU infrastructure. Free tier gives enough minutes to prototype and demo.

**vs Daily.co:** LiveKit is open-source and self-hostable if you outgrow free tier; Daily is proprietary SaaS only. LiveKit also has better AI/agent integration for voice bots.
**vs Jitsi (self-hosted):** Jitsi is a full video app you deploy; LiveKit is an SDK — you build your own UI. LiveKit for custom UX, Jitsi for "I just need a meeting room."


---

## Tinybird

| Field | Value |
|-------|-------|
| URL | https://www.tinybird.co |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free starter tier |

ClickHouse-backed APIs from event streams.

**Pick this if** you need sub-second analytics APIs over streaming event data (page views, IoT, logs) and want ClickHouse power without managing ClickHouse. Ingest → SQL pipe → published REST endpoint in minutes.

**vs MotherDuck:** Tinybird is for real-time streaming ingestion + API publishing; MotherDuck is for batch analytics on files you already have. Tinybird for live dashboards, MotherDuck for ad-hoc exploration.
**vs Supabase + pg_cron:** Tinybird handles millions of events/day with columnar compression; Postgres will choke on that volume. Use Supabase for your app DB, Tinybird for your analytics API.


---

## Svix

| Field | Value |
|-------|-------|
| URL | https://www.svix.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | ~50k messages/mo |

Outbound webhook delivery (Hookdeck's dual for sending).

**Pick this if** your SaaS needs to send webhooks to customers and you don't want to build retry logic, signature verification, delivery dashboards, and failure alerting from scratch. 50k msgs/mo free handles most early-stage products.

**vs rolling your own queue + retry:** Svix handles exponential backoff, signing, delivery logs, and customer-facing retry UI. Building that yourself is 2–4 weeks of work you'll regret maintaining.
**vs Hookdeck:** Hookdeck is for *receiving* webhooks (inbound); Svix is for *sending* them (outbound). They're complements, not competitors.


---

## Dub.co

| Field | Value |
|-------|-------|
| URL | https://dub.co |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free plan |

Link shortener with analytics — no Bitly tax.

**Pick this if** you share links publicly (newsletters, social, docs) and want click analytics + custom domains without Bitly's $35/mo paywall. The free tier is generous enough for indie projects and personal branding.

**vs Bitly:** Dub.co is open-source, cheaper at scale, and developer-friendly (API-first). Bitly charges for custom domains and advanced analytics that Dub includes free.
**vs just using your own redirect:** Dub gives you analytics, QR codes, link previews, and expiration without writing any code. A bare Nginx redirect gives you nothing.


---

## Hugging Face Spaces

| Field | Value |
|-------|-------|
| URL | https://huggingface.co/spaces |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free CPU · limited inference |

Prototype ML demos on free CPU Spaces.

**Pick this if** you want to deploy a Gradio/Streamlit ML demo that anyone can try via a URL — no server setup, no Docker, no cloud billing. Perfect for thesis demos, portfolio projects, and "try my model" links on your resume.

**vs Google Colab:** Spaces gives you a persistent public URL others can visit; Colab requires the notebook to be running and shared. Spaces for demos, Colab for experimentation.
**vs Replicate:** Replicate is pay-per-prediction for production inference; HF Spaces is free for CPU demos. Use Spaces to prototype, Replicate when you need GPU scale.


---

## Cron-job.org

| Field | Value |
|-------|-------|
| URL | https://cron-job.org |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free external cron jobs |

External cron — ping sleeping Render apps before demos.

**Pick this if** your free-tier Render/Railway app sleeps after 15 minutes of inactivity and you need it awake for demos, interviews, or monitoring. Set a 14-minute ping and your app never cold-starts in front of someone important.

**vs UptimeRobot:** UptimeRobot monitors and alerts when things are *down*; cron-job.org proactively *prevents* sleep by pinging on a schedule. UptimeRobot for observability, cron-job.org for keep-alive.
**vs GitHub Actions scheduled workflow:** Cron-job.org has 1-minute granularity and doesn't burn Actions minutes. It's also simpler — paste a URL, set an interval, done.


---

## Zyte Scrapy Cloud (Pack)

| Field | Value |
|-------|-------|
| URL | https://www.zyte.com |
| Cost | student free |
| Student | student required |
| Commercial | commercial ok |
| Limits | 1 unit forever · 120d retention |

One Scrapy Cloud unit forever via Pack.

**Pick this if** you have Scrapy spiders and want them running on a schedule in the cloud without maintaining a server or Docker cron. The Pack gives you one persistent unit — enough for a personal data pipeline that scrapes daily.

**vs self-hosted Scrapy + cron:** Zyte handles scheduling, log storage (120 days), and scaling without you babysitting a VPS. The tradeoff is vendor lock-in to their platform.
**vs Apify free tier:** Apify is broader (Puppeteer, Playwright, any scraper); Zyte is Scrapy-native. If your spiders are already Scrapy, Zyte deploys them as-is with zero rewrite.


---
