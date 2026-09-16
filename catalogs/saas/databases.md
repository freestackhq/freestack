---
category: Databases
description: Database platforms and data stores.
order: 1
---

# Databases

## Comparison Matrix

| Service | Cost | Student | Commercial | Limits |
|---------|------|---------|------------|--------|
| [Neon](#neon) | free forever | anyone | commercial ok | 0.5 GB · 5 GB egress/mo · scale-to-zero after 5m |
| [Turso](#turso) | free forever | anyone | commercial ok | 5 GB · 500M reads/mo · 100 DBs |
| [Supabase](#supabase) | free forever | anyone | commercial ok | 0.5 GB DB · 50k MAU · pauses after 7d idle |
| [Upstash Redis](#upstash-redis) | free forever | anyone | commercial ok | 256 MB · 10k commands/day |
| [Convex](#convex) | free forever | anyone | commercial ok | 0.5 GB · 1M function calls/mo |
| [Cloudflare D1](#cloudflare-d1) | free forever | anyone | commercial ok | 5 GB / DB · 5M rows read/day on free Workers |
| [MongoDB Atlas M0](#mongodb-atlas-m0) | free forever | anyone | commercial ok | 512 MB shared |
| [Appwrite Cloud](#appwrite-cloud) | free forever | anyone | commercial ok | 2 projects · 2 GB storage |
| [PocketBase](#pocketbase) | free forever | anyone | commercial ok | OSS · you pay VPS/Oracle/Koyeb only |

---

## Neon

| Field | Value |
|-------|-------|
| URL | https://neon.tech |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 0.5 GB · 5 GB egress/mo · scale-to-zero after 5m |
| Tags | postgres |

Serverless Postgres that scales to zero.

**Pick this if** you need real Postgres with zero cold-start cost, instant branching for preview deployments, and you refuse to babysit connection pools or idle instances.

**vs Supabase** — Neon is pure database; pick Supabase when you also want auth, storage, and REST auto-generated from your schema. Pick Neon when you want raw Postgres control without BaaS opinions.

**vs Turso** — Neon gives you full Postgres (joins, extensions, JSONB); Turso gives you SQLite semantics with edge-local reads. Pick Turso for read-heavy global apps; pick Neon for complex relational queries and migrations tooling.


---

## Turso

| Field | Value |
|-------|-------|
| URL | https://turso.tech |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 5 GB · 500M reads/mo · 100 DBs |
| Tags | sqlite, edge |

LibSQL at the edge — strong for read-heavy apps.

**Pick this if** your app is read-heavy (dashboards, content sites, analytics) and you want embedded replicas that sit next to your compute for sub-millisecond reads without a connection round-trip.

**vs Cloudflare D1** — Both are SQLite-at-edge. Pick D1 if you're already on Cloudflare Workers and want zero-config binding. Pick Turso if you deploy on Vercel/Fly/Deno and need a portable edge DB with embedded replicas you control.

**vs Neon** — Pick Turso when reads dominate and you want edge locality. Pick Neon when you need Postgres features (CTEs, full-text search, extensions) or write-heavy transactional workloads.


---

## Supabase

| Field | Value |
|-------|-------|
| URL | https://supabase.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 0.5 GB DB · 50k MAU · pauses after 7d idle |
| Tags | postgres, baas |

Postgres BaaS with auth, storage, and REST out of the box.

**Pick this if** you want a complete backend — auth, file storage, realtime subscriptions, and auto-generated REST/GraphQL — without stitching separate services together, and you still want raw Postgres access when the abstractions aren't enough.

**vs Appwrite Cloud** — Both are BaaS. Pick Supabase when you want real Postgres underneath (migrations, extensions, SQL). Pick Appwrite when you prefer a self-hostable, vendor-neutral platform with a simpler permissions model.

**vs Neon** — Pick Supabase when you want the full platform (auth, storage, edge functions) in one dashboard. Pick Neon when you only need the database and want to pair it with your own auth/storage choices.


---

## Upstash Redis

| Field | Value |
|-------|-------|
| URL | https://upstash.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 256 MB · 10k commands/day |
| Tags | redis |

Serverless Redis for cache and queues.

**Pick this if** you need a fast key-value layer for caching, rate-limiting, session tokens, or lightweight queues — and you want per-request pricing with no always-on instance to manage.

**vs Cloudflare KV/D1** — Pick Upstash when you need Redis data structures (sorted sets, pub/sub, Lua scripts) or when your stack isn't on Cloudflare. Pick D1/KV when you're already on Workers and want zero-network-hop access.

**vs a primary database (Neon/Turso)** — Upstash is a complement, not a replacement. Use it as the caching/queue layer in front of your relational store, not as your source of truth.


---

## Convex

| Field | Value |
|-------|-------|
| URL | https://convex.dev |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 0.5 GB · 1M function calls/mo |

Reactive backend with realtime sync for collaborative UIs.

**Pick this if** you're building a collaborative or realtime-first app (multiplayer editors, live dashboards, chat) in TypeScript and you want the database, server functions, and realtime subscriptions as one coherent system — no SQL, no ORM, no WebSocket plumbing.

**vs Supabase Realtime** — Supabase bolts realtime onto Postgres via change-data-capture; Convex is reactive from the ground up. Pick Convex when every query must live-update. Pick Supabase when you also need traditional REST endpoints and raw SQL escape hatches.

**vs Firebase** — Convex gives you TypeScript-native server functions with full ACID transactions; Firebase gives you a proprietary SDK with weaker consistency. Pick Convex for type-safe, transactional realtime; Firebase if you need its massive mobile ecosystem.


---

## Cloudflare D1

| Field | Value |
|-------|-------|
| URL | https://developers.cloudflare.com/d1/ |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 5 GB / DB · 5M rows read/day on free Workers |
| Tags | sqlite, edge |

SQLite at the edge on Workers.

**Pick this if** you're already on Cloudflare Workers and want a database that's a first-class binding — zero network hop, zero connection overhead, deployed alongside your code at the edge.

**vs Turso** — Both are edge SQLite. Pick D1 when your compute is Workers (native binding, no SDK needed). Pick Turso when you deploy elsewhere (Vercel, Fly, Deno) or need embedded replicas inside your app process.

**vs Neon** — Pick D1 for simple schemas and edge-speed reads on Workers. Pick Neon when you need full Postgres (complex joins, extensions, large write throughput) or when your app lives outside the Cloudflare ecosystem.


---

## MongoDB Atlas M0

| Field | Value |
|-------|-------|
| URL | https://www.mongodb.com/cloud/atlas |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 512 MB shared |

Classic document store, free forever shared cluster.

**Pick this if** your data is naturally document-shaped (nested objects, variable fields per record), you want a flexible schema that evolves without migrations, and you value the massive MongoDB ecosystem (Mongoose, Atlas Search, Charts).

**vs Neon/Supabase** — Pick MongoDB when your data doesn't fit neatly into rows and columns (CMS entries, event logs, IoT payloads). Pick Postgres (Neon/Supabase) when you need relational integrity, joins, and strong typing.

**vs Convex** — Both handle schema-flexible data. Pick Convex for realtime-first TypeScript apps. Pick MongoDB when you want a mature query language (aggregation pipeline), driver support in every language, and a proven path to massive scale.


---

## Appwrite Cloud

| Field | Value |
|-------|-------|
| URL | https://appwrite.io |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 2 projects · 2 GB storage |
| Tags | baas |

Auth + DB + Functions in one BaaS.

**Pick this if** you want a Firebase-like all-in-one platform (auth, database, functions, storage) that's fully open-source and self-hostable — giving you an exit door that proprietary BaaS platforms don't offer.

**vs Supabase** — Both are open-source BaaS. Pick Supabase when you want real Postgres and SQL power. Pick Appwrite when you prefer a document-style API, simpler permission rules, and don't need raw SQL.

**vs PocketBase** — Both are self-hostable. Pick PocketBase for a single-binary zero-dependency deploy on one VPS. Pick Appwrite when you need managed cloud hosting, multiple runtimes for functions, and a larger team/community behind the platform.


---

## PocketBase

| Field | Value |
|-------|-------|
| URL | https://pocketbase.io |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS · you pay VPS/Oracle/Koyeb only |
| Tags | oss, baas, sqlite |
| Verified | 2026-07-24 |

Single-binary BaaS — SQLite, auth, files, realtime without a cloud bill.

**Pick this if** you want the simplest possible self-hosted backend — one binary, no Docker required, zero monthly cost on a free-tier VPS — and your app is small-to-medium scale where SQLite's single-writer model is fine.

**vs Supabase** — Pick PocketBase when you want total ownership with no cloud dependency and your traffic fits one machine. Pick Supabase when you need horizontal scale, managed infra, and Postgres features.

**vs Appwrite** — Both are open-source BaaS. Pick PocketBase for radical simplicity (single Go binary, embed in your app). Pick Appwrite for a richer feature set (multiple function runtimes, team collaboration, managed cloud option).


---
