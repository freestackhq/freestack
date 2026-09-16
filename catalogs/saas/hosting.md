---
category: Hosting
description: Hosting, runtimes, and deployment platforms.
order: 2
---

# Hosting

## Comparison Matrix

| Service | Cost | Student | Commercial | Limits |
|---------|------|---------|------------|--------|
| [Cloudflare Workers & Pages](#cloudflare-workers-and-pages) | free forever | anyone | commercial ok | 100k requests/day · static unlimited |
| [Koyeb](#koyeb) | free forever | anyone | commercial ok | 1 web service · 512 MB · 0.1 vCPU |
| [Vercel Hobby](#vercel-hobby) | free forever | anyone | hobby only | 100 GB bandwidth/mo · non-commercial |
| [Railway](#railway) | credits | anyone | commercial ok | ~$5 credit/mo then $5 base + usage |
| [Render](#render) | free forever | anyone | commercial ok | 750 hrs/mo · sleep after 15m · free Postgres expires 30d |
| [Netlify](#netlify) | free forever | anyone | check ToS | 100 GB bandwidth · 300 build min/mo |
| [Deno Deploy](#deno-deploy) | free forever | anyone | commercial ok | 1M requests/mo |
| [Oracle Cloud Always Free](#oracle-cloud-always-free) | free forever | anyone | commercial ok | 2× AMD VMs + 4 ARM OCPUs · 200 GB block |
| [Coolify](#coolify) | free forever | anyone | commercial ok | OSS · unlimited apps on your infra |

---

## Cloudflare Workers & Pages

| Field | Value |
|-------|-------|
| URL | https://workers.cloudflare.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 100k requests/day · static unlimited |

Edge functions + unlimited static hosting.

**Pick this if** your app is a static frontend + API routes and you want zero cold starts at the edge with the most generous free static tier available — no bandwidth caps, no sleep, no containers to manage.

**vs Vercel Hobby:** Both deploy static + functions, but Workers runs on 300+ edge locations with no commercial-use restriction; Vercel locks you to hobby/non-commercial on the free plan. **vs Render:** Render gives you a container that sleeps after 15 min; Workers never sleeps and responds in <50 ms globally.


---

## Koyeb

| Field | Value |
|-------|-------|
| URL | https://www.koyeb.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 1 web service · 512 MB · 0.1 vCPU |

Managed containers that stay up 24/7 on free micro.

**Pick this if** you need a container that never sleeps — Discord bots, background workers, or long-running processes that must stay warm without paying. Koyeb's free micro runs 24/7 with zero cold-start penalty.

**vs Render:** Render's free web services sleep after 15 min of inactivity (30–60 s cold starts); Koyeb stays awake permanently. **vs Railway:** Railway gives ~$5/mo in credits that run out; Koyeb's free instance is truly unlimited hours.


---

## Vercel Hobby

| Field | Value |
|-------|-------|
| URL | https://vercel.com |
| Cost | free forever |
| Student | anyone |
| Commercial | hobby only |
| Limits | 100 GB bandwidth/mo · non-commercial |

Next.js-native deploys. Personal projects only.

**Pick this if** you're building a Next.js side project and want the tightest integration possible — ISR, middleware, image optimization, and preview deployments all work out of the box with zero config. Accept the non-commercial restriction and enjoy the DX.

**vs Cloudflare Pages:** Cloudflare allows commercial use and has no bandwidth cap, but Next.js support is partial (no streaming RSC, limited middleware); Vercel is the canonical Next.js host. **vs Netlify:** Netlify also deploys Next.js but lags behind on latest features and has tighter build-minute limits.


---

## Railway

| Field | Value |
|-------|-------|
| URL | https://railway.app |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | ~$5 credit/mo then $5 base + usage |

Git-push containers with a small monthly credit.

**Pick this if** you want the simplest git-push-to-deploy container experience with databases, cron, and private networking included — and you're okay spending $5/mo once the free credit runs out. Railway treats containers as first-class: Postgres, Redis, and workers all live in one project.

**vs Render:** Render's free tier sleeps and the free Postgres expires after 30 days; Railway's $5 credit covers always-on compute + persistent DB. **vs Koyeb:** Koyeb gives you one always-free micro, but Railway gives a full project graph (app + DB + worker) under one credit pool.


---

## Render

| Field | Value |
|-------|-------|
| URL | https://render.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 750 hrs/mo · sleep after 15m · free Postgres expires 30d |

Web services without a credit card. Sleeps when idle.

**Pick this if** you want to ship a demo or portfolio app with zero financial commitment — no credit card, no trial expiry, no surprise bills. The 15-minute sleep is fine for anything that tolerates a cold start on first hit (portfolio sites, demo APIs, interview take-homes).

**vs Koyeb:** Koyeb never sleeps but limits you to one 512 MB micro; Render gives 750 free hours across multiple services (useful for multi-service demos). **vs Railway:** Railway requires a credit card and charges after credits are gone; Render stays free forever if you accept the sleep trade-off.


---

## Netlify

| Field | Value |
|-------|-------|
| URL | https://www.netlify.com |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | 100 GB bandwidth · 300 build min/mo |

JAMstack hosting + serverless functions.

**Pick this if** you're shipping a static site or SPA that needs a few serverless functions for forms, auth, or API proxying — and you want 100 GB bandwidth free without worrying about cold containers or edge-runtime constraints. Netlify's build plugins and form handling are unmatched for content sites.

**vs Cloudflare Pages:** Cloudflare has no bandwidth cap and faster edge functions, but Netlify's build plugin ecosystem (CMS previews, form handling, split testing) is richer for content-heavy JAMstack. **vs Vercel Hobby:** Netlify allows commercial use on the free tier; Vercel Hobby restricts you to non-commercial projects.


---

## Deno Deploy

| Field | Value |
|-------|-------|
| URL | https://deno.com/deploy |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 1M requests/mo |

TypeScript at the edge; pairs with Deno KV.

**Pick this if** you're writing TypeScript/Deno-native code and want an edge runtime with built-in KV storage — no external database required for small apps. 1M requests/month free makes it viable for real production traffic, not just demos.

**vs Cloudflare Workers:** Both are edge runtimes, but Deno Deploy uses standard Web APIs + Deno KV with zero config; Workers requires learning KV/D1 bindings and the Cloudflare-specific module system. **vs Vercel Edge Functions:** Vercel's edge runtime is a thin layer on top of their Node platform; Deno Deploy is the runtime itself with first-party KV, giving you a complete backend in one place.


---

## Oracle Cloud Always Free

| Field | Value |
|-------|-------|
| URL | https://www.oracle.com/cloud/free/ |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 2× AMD VMs + 4 ARM OCPUs · 200 GB block |

Real VMs forever — if you survive signup.

**Pick this if** you need actual Linux VMs with root access, persistent storage, and serious compute (4 ARM OCPUs + 24 GB RAM is more than most $50/mo VPS plans) — and you're patient enough to fight Oracle's signup lottery. Once provisioned, these run any stack: Docker, K3s, databases, game servers, whatever.

**vs Koyeb/Render/Railway:** Those are managed PaaS with opinionated runtimes; Oracle gives you bare metal control — install anything, run anything, no platform lock-in. **vs Fly.io:** Fly gives you global distribution but charges per GB/hour; Oracle gives you one region but 24 GB RAM free forever.


---

## Coolify

| Field | Value |
|-------|-------|
| URL | https://coolify.io |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS · unlimited apps on your infra |
| Tags | oss, paas |
| Verified | 2026-07-24 |

Self-hosted PaaS — Heroku/Render shape on your VPS.

**Pick this if** you already have a VPS (Oracle Always Free, Hetzner, etc.) and want a Heroku-like UI for deploying unlimited apps without per-service fees. Coolify handles git deploys, SSL, databases, and backups — you own the entire stack.

**vs Railway/Render:** Those charge per service or impose free-tier limits; Coolify is free and unlimited — you only pay for the underlying VM. **vs Oracle Cloud alone:** Oracle gives you the VM but no deployment tooling; Coolify turns that raw VM into a one-click PaaS with auto-SSL and Docker Compose support.


---
