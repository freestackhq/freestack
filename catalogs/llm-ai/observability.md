---
category: Observability
description: LLM cost tracking, tracing, evaluation, and monitoring tools
---

# Observability

## Comparison Matrix

| Service | Auth | Free Tier | Models | OpenAI-compatible | Status |
|---------|------|-----------|--------|-------------------|--------|
| [Langfuse](#langfuse) | api-key | generous free cloud + self-host | traces, evals, prompts | ✓ (via integrations) | active |
| [Helicone](#helicone) | api-key | free tier with request caps | proxy + analytics | ✓ (proxy) | active |

---

## Langfuse

| Field | Value |
|-------|-------|
| API Base | https://cloud.langfuse.com/api |
| Docs | https://langfuse.com/docs |
| Auth | api-key |
| Free Tier | generous free cloud tier, self-host unlimited |
| Models | N/A (observability layer) |
| OpenAI-compatible | ✓ (via SDK wrappers) |
| Streaming | ✓ |
| Self-host | ✓ |
| Status | active |

Open-source LLM observability: traces, cost tracking, latency, prompt management, evaluations, and datasets. Integrates with LangChain, OpenAI SDK, Vercel AI SDK, and more. Self-host for free or use their cloud.

**Pick this if** you want full LLM observability (traces + costs + evals) and the option to self-host.

**vs Helicone** — Langfuse is deeper (evals, datasets, prompt versioning); Helicone is simpler (proxy + dashboard).

---

## Helicone

| Field | Value |
|-------|-------|
| API Base | https://oai.helicone.ai/v1 (proxy) |
| Docs | https://docs.helicone.ai |
| Auth | api-key |
| Free Tier | free tier with request caps |
| Models | N/A (proxy layer) |
| OpenAI-compatible | ✓ (it IS a proxy) |
| Streaming | ✓ |
| Self-host | ✗ |
| Status | active |

One-line integration: swap your OpenAI base URL to Helicone's proxy and get cost tracking, caching, rate limiting, and request logs. Zero code change beyond the base URL.

**Pick this if** you want the simplest possible LLM cost/usage visibility — change one URL and get a dashboard.

**vs Langfuse** — Simpler setup (just a proxy URL) but less depth; Langfuse has evals, datasets, and self-hosting.
