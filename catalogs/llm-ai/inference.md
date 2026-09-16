---
category: Inference
description: Cloud LLM inference providers with free tiers for chat, completion, and tool use
---

# Inference

## Comparison Matrix

| Service | Auth | Free Tier | Models | OpenAI-compatible | Status |
|---------|------|-----------|--------|-------------------|--------|
| [OpenRouter](#openrouter) | api-key | free-tagged models, no cost | Llama 3.3 70B, Gemma 4, etc. | ✓ | active |
| [Groq](#groq) | api-key | generous daily tokens | Llama 3.3 70B, DeepSeek R1, Qwen | ✓ | active |
| [Cerebras](#cerebras) | api-key | free tier tokens | Llama 3.3 70B | ✓ | active |
| [Google AI Studio](#google-ai-studio) | api-key | 1500 req/day (Flash) | Gemini 3 Flash, Gemma 3 | ✓ | active |
| [Mistral](#mistral) | api-key | free tier available | Mistral Nemo | ✓ | active |
| [DeepSeek](#deepseek) | api-key | low cost PAYG / promo credits | DeepSeek-V3, DeepSeek-R1 | ✓ | active |
| [Cloudflare Workers AI](#cloudflare-workers-ai) | api-key | 10k neurons/day | Llama, Mistral, Phi models | ✓ | active |

---

## OpenRouter

| Field | Value |
|-------|-------|
| API Base | https://openrouter.ai/api/v1 |
| Docs | https://openrouter.ai/docs |
| Auth | api-key |
| Free Tier | models tagged `:free` cost $0 (rate-limited) |
| Models | meta-llama/llama-3.3-70b-instruct:free, google/gemma-4-31b:free, nvidia/ling-3.0-flash:free |
| OpenAI-compatible | ✓ |
| Streaming | ✓ |
| Self-host | ✗ |
| Status | active |

Meta-router across 200+ models from dozens of providers. Free-tagged models run at $0 with rate limits. Pay-per-token for everything else. One API key works across all providers, making it ideal as a failover entry point.

**Pick this if** you want one API key to access many providers and use `:free` models for development/side projects.

**vs Groq** — OpenRouter is a router (many providers); Groq is a single ultra-fast inference provider. OpenRouter's free models rotate; Groq's free tier is more predictable.

---

## Groq

| Field | Value |
|-------|-------|
| API Base | https://api.groq.com/openai/v1 |
| Docs | https://console.groq.com/docs |
| Auth | api-key |
| Free Tier | generous daily token limits (varies by model) |
| Models | llama-3.3-70b-versatile, deepseek-r1-distill-llama-70b, qwen/qwen-qwq-32b |
| OpenAI-compatible | ✓ |
| Streaming | ✓ |
| Self-host | ✗ |
| Status | active |

Fastest inference available — LPU hardware delivers tokens at 500+ tok/sec for Llama 70B. Free tier has daily token/request caps but is extremely fast. Ideal for real-time chat and tool-calling loops.

**Pick this if** you need the fastest token generation and your use case fits within daily free limits.

**vs Cerebras** — Both are speed-focused. Groq has more model variety; Cerebras is similarly fast but with fewer models.

---

## Cerebras

| Field | Value |
|-------|-------|
| API Base | https://api.cerebras.net/v1 |
| Docs | https://docs.cerebras.ai |
| Auth | api-key |
| Free Tier | free tier with token limits |
| Models | llama-3.3-70b |
| OpenAI-compatible | ✓ |
| Streaming | ✓ |
| Self-host | ✗ |
| Status | active |

Wafer-scale inference hardware. Similar speed story to Groq with extremely fast generation. Currently offers fewer models but competitive on Llama variants.

**Pick this if** you want an alternative fast provider to Groq for failover, or Groq's daily limits are exhausted.

**vs Groq** — Similar speed; Groq has more model options. Good as a failover provider in a multi-provider router.

---

## Google AI Studio

| Field | Value |
|-------|-------|
| API Base | https://generativelanguage.googleapis.com/v1beta/openai |
| Docs | https://ai.google.dev/docs |
| Auth | api-key |
| Free Tier | 1500 req/day (Flash), 50 req/day (Pro) |
| Models | gemini-3-flash, gemini-3.5-flash-lite, gemma-3-27b-it |
| OpenAI-compatible | ✓ (via compatibility endpoint) |
| Streaming | ✓ |
| Self-host | ✗ |
| Status | active |

Google's AI models via API. Gemini Flash is fast and cheap (generous free tier). Supports multimodal (images, audio, video), function calling, and structured output. The OpenAI-compatible endpoint means you can use the OpenAI SDK.

**Pick this if** you need multimodal (image/video understanding), long context (1M tokens), or the most generous free daily quota.

**vs Groq** — Gemini is multimodal and has longer context; Groq is faster for text-only chat. Gemini free tier is more generous per day.

---

## Mistral

| Field | Value |
|-------|-------|
| API Base | https://api.mistral.ai/v1 |
| Docs | https://docs.mistral.ai |
| Auth | api-key |
| Free Tier | free tier for open models |
| Models | open-mistral-nemo |
| OpenAI-compatible | ✓ |
| Streaming | ✓ |
| Self-host | ✗ (weights downloadable for local) |
| Status | active |

European AI lab's API. Mistral Nemo (12B) is free-tier eligible and good for structured output and function calling. Mistral models tend to be efficient for their size class.

**Pick this if** you want a strong small model (Nemo 12B) with good instruction following and structured output.

**vs Google AI Studio** — Smaller models, more predictable outputs for structured tasks; Gemini is more capable but heavier.

---

## Cloudflare Workers AI

| Field | Value |
|-------|-------|
| API Base | https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/openai |
| Docs | https://developers.cloudflare.com/workers-ai |
| Auth | api-key (CF API token) |
| Free Tier | 10,000 neurons/day |
| Models | @cf/meta/llama-4-scout-17b-16e-instruct, Mistral, Phi, Gemma variants |
| OpenAI-compatible | ✓ |
| Streaming | ✓ |
| Self-host | ✗ |
| Status | active |

Run inference at the edge alongside your Cloudflare Workers. No cold starts for AI if your app is already on Workers. 10k neurons/day free, then usage-based. Good for adding AI features to existing Workers apps.

**Pick this if** your app is already on Cloudflare Workers and you want AI inference with zero extra infra.

**vs Groq** — Slower inference but integrated into Cloudflare edge; no separate billing. Groq is faster but requires separate API management.

---

## DeepSeek

| Field | Value |
|-------|-------|
| API Base | https://api.deepseek.com/v1 |
| Docs | https://platform.deepseek.com/api-docs |
| Auth | api-key |
| Free Tier | low cost PAYG / occasional signup promo credits |
| Models | deepseek-chat (V3), deepseek-reasoner (R1) |
| OpenAI-compatible | ✓ |
| Streaming | ✓ |
| Self-host | ✓ (open weights on HuggingFace / Ollama) |
| Status | active |

Direct API from DeepSeek offering industry-leading price-to-performance on open-weight foundation models. Full OpenAI-compatible chat completions endpoint supporting standard system prompts, structured tool use, and streaming. Open weights allow identical execution locally or on third-party hosters.

**Pick this if** you want state-of-the-art reasoning (R1) or general-purpose chat (V3) at near-zero per-token API cost or wish to prototype against open-weight frontier models.

**vs Groq** — DeepSeek API provides native first-party checkpoints directly; Groq offers faster LPU inference on hosted open weights with daily free ceilings.

