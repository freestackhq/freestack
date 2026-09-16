---
category: Storage & media
description: Object storage, buckets, and media.
order: 5
---

# Storage & media

## Comparison Matrix

| Service | Cost | Student | Commercial | Limits |
|---------|------|---------|------------|--------|
| [Cloudflare R2](#cloudflare-r2) | free forever | anyone | commercial ok | 10 GB · 1M Class A · 10M Class B · $0 egress |
| [Backblaze B2](#backblaze-b2) | free forever | anyone | commercial ok | 10 GB free |
| [UploadThing](#uploadthing) | free forever | anyone | commercial ok | 2 GB storage |
| [Cloudinary](#cloudinary) | free forever | anyone | commercial ok | 25 credits/mo |
| [Tigris](#tigris) | free forever | anyone | commercial ok | ~5 GB storage · egress caps on free · check current |

---

## Cloudflare R2

| Field | Value |
|-------|-------|
| URL | https://www.cloudflare.com/developer-platform/r2/ |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 10 GB · 1M Class A · 10M Class B · $0 egress |

S3-compatible object storage with zero egress fees.

**Pick this if** you need general-purpose object storage and refuse to pay egress taxes — especially if you're already on Cloudflare Workers or Pages. The 10 GB free tier plus zero egress makes it the default choice for any project that serves files to users.

**vs Backblaze B2:** R2 gives you zero egress natively; B2 only waives egress if you route through Cloudflare CDN. R2 also has tighter Workers integration (bindings, no auth overhead). Pick B2 only for cold archive you rarely read.
**vs Tigris:** Both are S3-compatible, but R2 is battle-tested at Cloudflare scale with richer ecosystem tooling. Tigris wins if your compute lives on Fly and you want automatic edge replication without CDN config.


---

## Backblaze B2

| Field | Value |
|-------|-------|
| URL | https://www.backblaze.com/b2/cloud-storage.html |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 10 GB free |

Cheap archive storage; egress waived via Cloudflare.

**Pick this if** you have cold data (backups, exports, user archives) that's written once and rarely read — and you want the absolute cheapest $/GB at rest. Pair it with a Cloudflare CDN zone to get free egress via the Bandwidth Alliance.

**vs Cloudflare R2:** B2 is cheaper per GB stored ($0.005 vs $0.015), but R2's zero egress is unconditional and doesn't require CDN fronting. If you read files frequently, R2 wins on total cost. B2 is the budget cold-storage play.
**vs Tigris:** B2 has no edge replication or smart caching — it's a single-region bucket. Tigris is better if latency matters; B2 is better if you just want a cheap vault.


---

## UploadThing

| Field | Value |
|-------|-------|
| URL | https://uploadthing.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 2 GB storage |

File uploads wired for Next.js in minutes.

**Pick this if** you're building a Next.js app and want file uploads working in under 30 minutes with zero infra config — presigned URLs, progress callbacks, type-safe routes, and a dashboard included. The 2 GB free tier is tight but perfect for MVPs and prototypes.

**vs Cloudflare R2:** R2 gives you raw S3 buckets — you'll wire presigned URLs and client uploaders yourself. UploadThing is a managed upload layer with built-in UI components and callbacks. Pick R2 when you outgrow 2 GB or need full control; pick UploadThing when speed-to-ship matters more.
**vs Cloudinary:** Cloudinary transforms media after upload; UploadThing just stores and serves files. If you need resizing, cropping, or format conversion, Cloudinary is the tool. If you just need "user uploads a file, app stores it," UploadThing is simpler.


---

## Cloudinary

| Field | Value |
|-------|-------|
| URL | https://cloudinary.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 25 credits/mo |

On-the-fly image and video transforms.

**Pick this if** your app is image-heavy or video-heavy and you need resize, crop, format conversion, watermarking, or adaptive streaming without running your own pipeline. The URL-based transform API means zero server code for media manipulation. 25 credits/mo covers a surprising number of transformations for a small SaaS.

**vs Cloudflare R2:** R2 stores bytes; Cloudinary transforms them. If you just need a bucket, R2 is cheaper and simpler. If you need `?w=300&h=300&fit=crop` in a URL, Cloudinary does it out of the box while R2 requires you to build (or buy) an image resizing layer.
**vs UploadThing:** UploadThing handles the upload flow; Cloudinary handles post-upload processing. For a media-rich app you might use both — UploadThing for the upload UX and Cloudinary as the CDN/transform layer — but if you must pick one, Cloudinary is the choice when transforms are a core feature.


---

## Tigris

| Field | Value |
|-------|-------|
| URL | https://www.tigrisdata.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | ~5 GB storage · egress caps on free · check current |
| Tags | s3, edge |
| Verified | 2026-07-24 |

S3-compatible object storage with edge caching — pairs cleanly with Fly.

**Pick this if** your compute runs on Fly.io and you want object storage that automatically replicates to the regions where your app instances run — no CDN configuration, no cache invalidation logic. Globally distributed by default with an S3-compatible API, so migration from R2 or AWS S3 is a find-and-replace on the endpoint.

**vs Cloudflare R2:** Both are S3-compatible with free tiers, but Tigris is built for multi-region replication out of the box while R2 serves from a single location (fronted by Cloudflare's CDN). If you're on Fly, Tigris gives lower latency without extra config. If you're on Cloudflare Workers, R2's native bindings win.
**vs Backblaze B2:** Tigris is hot storage with edge caching; B2 is cold archive. Tigris costs more per GB but delivers faster reads globally. Use B2 for data you rarely access; use Tigris for assets your users fetch on every page load.


---
