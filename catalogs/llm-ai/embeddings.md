---
category: Embeddings
description: Text and multimodal embedding APIs for RAG, search, and similarity
---

# Embeddings

## Comparison Matrix

| Service | Auth | Free Tier | Models | OpenAI-compatible | Status |
|---------|------|-----------|--------|-------------------|--------|
| [Voyage AI](#voyage-ai) | api-key | free tokens on signup | voyage-3, voyage-code-3 | ✗ (own SDK) | active |
| [Together Embeddings](#together-embeddings) | api-key | promo credits | BAAI/bge, e5-mistral | ✓ | active |
| [Cloudflare Workers AI](#cloudflare-workers-ai-embeddings) | api-key | 10k neurons/day shared | bge-base-en, bge-large-en | ✓ | active |

---

## Voyage AI

| Field | Value |
|-------|-------|
| API Base | https://api.voyageai.com/v1 |
| Docs | https://docs.voyageai.com |
| Auth | api-key |
| Free Tier | free tokens on signup (then PAYG) |
| Models | voyage-3, voyage-3-lite, voyage-code-3 |
| OpenAI-compatible | ✗ (own SDK, similar format) |
| Streaming | ✗ (batch) |
| Self-host | ✗ |
| Status | active |

Top-tier embedding quality, especially for code (voyage-code-3) and retrieval tasks. Benchmarks consistently near the top on MTEB. Free credits on signup let you prototype RAG pipelines.

**Pick this if** you need the highest-quality embeddings for retrieval/RAG and can afford PAYG after free credits.

**vs Together Embeddings** — Better quality for code and retrieval; Together is cheaper at scale with open-weight models.

---

## Together Embeddings

| Field | Value |
|-------|-------|
| API Base | https://api.together.xyz/v1 |
| Docs | https://docs.together.ai/reference/embeddings |
| Auth | api-key |
| Free Tier | promo credits on signup |
| Models | BAAI/bge-large-en-v1.5, intfloat/e5-mistral-7b-instruct |
| OpenAI-compatible | ✓ |
| Streaming | ✗ (batch) |
| Self-host | ✗ (but models are open-weight) |
| Status | active |

Open-weight embedding models hosted. Because the models are open (BGE, E5), you can self-host later without vendor lock-in. OpenAI SDK compatible.

**Pick this if** you want OpenAI-compatible embeddings from open-weight models with an escape hatch to self-host.

**vs Voyage AI** — Lower quality ceiling but open models mean you can self-host; Voyage is proprietary but higher quality.

---

## Cloudflare Workers AI (Embeddings)

| Field | Value |
|-------|-------|
| API Base | https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/openai |
| Docs | https://developers.cloudflare.com/workers-ai/models/#text-embeddings |
| Auth | api-key (CF API token) |
| Free Tier | shared 10k neurons/day (with inference budget) |
| Models | @cf/baai/bge-base-en-v1.5, @cf/baai/bge-large-en-v1.5 |
| OpenAI-compatible | ✓ |
| Streaming | ✗ |
| Self-host | ✗ |
| Status | active |

Embedding generation at the Cloudflare edge. Pairs naturally with Vectorize (their vector DB) and Workers for end-to-end RAG without leaving the Cloudflare ecosystem.

**Pick this if** your RAG stack is on Cloudflare (Workers + Vectorize + AI) and you want zero-hop embeddings.

**vs Voyage AI** — Lower quality models (BGE vs Voyage) but free and integrated into Cloudflare; Voyage is better quality but separate infra.
