---
category: Jobs & automation
description: Job queues, schedulers, and workflow automation.
order: 6
---

# Jobs & automation

## Comparison Matrix

| Service | Cost | Student | Commercial | Limits |
|---------|------|---------|------------|--------|
| [Inngest](#inngest) | free forever | anyone | commercial ok | ~50k steps/mo |
| [Trigger.dev](#trigger-dev) | free forever | anyone | commercial ok | Generous free tier |
| [Upstash QStash](#upstash-qstash) | free forever | anyone | commercial ok | 500 messages/day |
| [Pipedream / n8n Cloud](#pipedream-n8n-cloud) | free forever | anyone | check ToS | Free workflow caps |
| [n8n (self-host)](#n8n-self-host) | free forever | anyone | check ToS | Fair-code OSS self-host · cloud has free trial then paid |

---

## Inngest

| Field | Value |
|-------|-------|
| URL | https://www.inngest.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | ~50k steps/mo |

Durable functions, retries, cron — no Redis babysitting.

**Pick this if** your app needs durable background functions with automatic retries, cron scheduling, or fan-out — and you refuse to manage Redis or a separate queue. Ship `inngest.createFunction()` alongside your Next.js/Remix app and get step-level observability for free (~50k steps/mo).

**vs Trigger.dev** — Inngest is higher-level: you declare steps and it handles retries/replay; Trigger.dev gives you a full serverless runtime for long-running jobs with more control over execution. Pick Inngest when you want zero-infra orchestration; pick Trigger.dev when your jobs run minutes-long or need custom Docker images.

---

## Trigger.dev

| Field | Value |
|-------|-------|
| URL | https://trigger.dev |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Generous free tier |

Long-running Node jobs with observability.

**Pick this if** your background jobs are compute-heavy or long-running (AI inference, video processing, multi-step pipelines) and you want a proper serverless runtime with the v3 SDK's built-in observability, log streaming, and retries — without managing workers or VMs.

**vs Inngest** — Trigger.dev gives you a full execution environment (think "serverless Sidekiq") so jobs can run for minutes/hours; Inngest caps individual steps and is better for short, event-driven orchestrations. Choose Trigger.dev when job duration or custom dependencies matter more than declarative step graphs.

---

## Upstash QStash

| Field | Value |
|-------|-------|
| URL | https://upstash.com/qstash |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 500 messages/day |

HTTP queue that wakes serverless endpoints.

**Pick this if** you just need a reliable HTTP message queue to wake serverless endpoints on a schedule or after an event — no SDK lock-in, no runtime to deploy. QStash is the lightest option here: POST a message, it delivers with retries and delay. Ideal for Vercel/Cloudflare apps that can't hold open connections (500 msg/day free).

**vs Inngest** — QStash is a dumb pipe (deliver this HTTP request later with retries); Inngest is a smart orchestrator (run this multi-step function). Pick QStash when your logic already lives in an endpoint and you just need guaranteed delivery; pick Inngest when you need step-level state, fan-out, or cron built in.

---

## Pipedream / n8n Cloud

| Field | Value |
|-------|-------|
| URL | https://pipedream.com |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | Free workflow caps |

Glue APIs together without writing glue code.

**Pick this if** you want to glue third-party APIs together (Stripe → Slack, GitHub → Notion) without writing integration code. Pipedream's low-code builder lets you wire triggers and actions visually, with a generous free tier that covers hobby/startup volumes.

**vs n8n Cloud** — Pipedream is fully managed and has deeper pre-built API integrations; n8n Cloud gives you a self-hostable escape hatch and more complex branching logic. Pick Pipedream for quick, managed API glue; pick n8n when you want open-source ownership or heavier workflow logic.

---

## n8n (self-host)

| Field | Value |
|-------|-------|
| URL | https://n8n.io |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | Fair-code OSS self-host · cloud has free trial then paid |
| Tags | oss, automation |
| Verified | 2026-07-24 |

Workflow automation + agent graphs without Pipedream caps.

**Pick this if** you want Zapier-level workflow automation you fully own — run it in Docker on your homelab or VPS with zero per-execution fees. Best for complex multi-branch automations, agent-style graphs, or when Pipedream's free tier caps become a bottleneck.

**vs Pipedream** — n8n is open-source and self-hostable so you pay only for compute; Pipedream is managed but locks you into their execution limits. Pick n8n when you need unlimited executions, data sovereignty, or want to extend nodes with custom code without vendor limits.

---
