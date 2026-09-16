---
category: AI & models
description: AI models, inference, and LLM tooling.
order: 10
---

# AI & models

## Comparison Matrix

| Service | Cost | Student | Commercial | Limits |
|---------|------|---------|------------|--------|
| [OpenRouter](#openrouter) | credits | anyone | commercial ok | Pay-per-token · free-tier models available · set spend caps |
| [Groq](#groq) | free forever | anyone | check ToS | Free quota then PAYG · rate limits apply |
| [Google AI Studio](#google-ai-studio) | free forever | anyone | check ToS | Free quota for experimentation · check commercial ToS |
| [Cloudflare Workers AI](#cloudflare-workers-ai) | free forever | anyone | commercial ok | Daily free neurons · then usage pricing |
| [Together AI](#together-ai) | credits | anyone | commercial ok | PAYG · occasional free credits via promos |
| [Fireworks AI](#fireworks-ai) | credits | anyone | commercial ok | PAYG · free trial credits often |
| [OpenAI API](#openai-api) | credits | anyone | commercial ok | No forever free · usage billing · project spend limits |
| [Anthropic API](#anthropic-api) | credits | anyone | commercial ok | Usage billing · set org spend caps |
| [Replicate](#replicate) | credits | anyone | commercial ok | PAYG per second · free trial credit windows |
| [Modal](#modal) | credits | anyone | commercial ok | Free credits on signup · then usage |
| [Langfuse](#langfuse) | free forever | anyone | commercial ok | Generous free cloud · self-host free |
| [Helicone](#helicone) | free forever | anyone | commercial ok | Free tier with request caps |
| [Mem0](#mem0) | free forever | anyone | commercial ok | Free tier for early agents |
| [Browserbase](#browserbase) | credits | anyone | commercial ok | Free trial / starter caps · then usage |
| [Milvus](#milvus) | free forever | anyone | commercial ok | OSS · you pay infra · or use Zilliz Cloud free cluster |
| [Zilliz Cloud](#zilliz-cloud) | free forever | anyone | commercial ok | Free cluster · 5 GB · 2.5M vCU/mo · 5 collections |
| [Qdrant](#qdrant) | free forever | anyone | commercial ok | Free cluster · 1 GB RAM · 4 GB disk · suspends after 1w idle |
| [Chroma](#chroma) | free forever | anyone | commercial ok | OSS local free · Chroma Cloud has a free tier (check caps) |
| [Pinecone](#pinecone) | free forever | anyone | commercial ok | Starter free serverless quota · then usage |
| [Weaviate](#weaviate) | free forever | anyone | commercial ok | Self-host free · Cloud sandbox/trial then paid |
| [pgvector](#pgvector) | free forever | anyone | commercial ok | OSS extension · limited by your Postgres plan storage/CPU |
| [Cohere](#cohere) | free forever | anyone | check ToS | Free trial keys · rate limits · then PAYG |
| [Hugging Face Inference](#hugging-face-inference) | credits | anyone | check ToS | Free CPU quota · paid for speed/GPU · model licenses vary |
| [Cerebras Inference](#cerebras-inference) | free forever | anyone | check ToS | Free tier with rate limits · then paid |
| [DeepSeek API](#deepseek-api) | credits | anyone | commercial ok | Low PAYG rates · occasional promo credit · check ToS region |
| [LangSmith](#langsmith) | free forever | anyone | commercial ok | Free Developer plan with trace caps |
| [Ollama](#ollama) | free forever | anyone | commercial ok | OSS · your GPU/CPU · model licenses vary |
| [LM Studio](#lm-studio) | free forever | anyone | check ToS | Free app · model licenses vary |
| [Voyage AI](#voyage-ai) | credits | anyone | commercial ok | Free tokens on signup · then PAYG |
| [Together Embeddings](#together-embeddings) | credits | anyone | commercial ok | PAYG · promo credits sometimes |
| [Vercel AI SDK](#vercel-ai-sdk) | free forever | anyone | commercial ok | OSS SDK free · inference cost = your provider |
| [Continue.dev](#continuedev) | free forever | anyone | commercial ok | OSS · your model backend |
| [Tavily](#tavily) | free forever | anyone | commercial ok | ~1k API credits/mo free class |
| [Exa](#exa) | free forever | anyone | commercial ok | Free signup credits · then PAYG |
| [LlamaIndex](#llamaindex) | free forever | anyone | commercial ok | OSS framework free · you pay model/vector backends |
| [Unsloth](#unsloth) | free forever | anyone | commercial ok | OSS · runs on free Colab T4 class GPUs |
| [Browserless](#browserless) | credits | anyone | commercial ok | Free/starter unit caps · then usage |
| [Flowise](#flowise) | free forever | anyone | commercial ok | OSS self-host · or npx · you pay models |
| [Kiro](#kiro) | free forever | anyone | commercial ok | 50 credits/mo free · Pro $20/mo 1,000 credits · 500 bonus on first 14d |
| [Amazon Q Developer](#amazon-q-developer) | free forever | anyone | commercial ok | Free Individual tier · Pro $19/mo for expanded limits |
| [Cursor](#cursor) | free forever | anyone | commercial ok | Hobby free: 2,000 completions/mo · Pro $20/mo usage-based |
| [Windsurf](#windsurf) | free forever | anyone | commercial ok | Free: ~25 Flow Actions/mo + unlimited autocomplete · Pro $20/mo |
| [GitHub Copilot Free](#github-copilot-free) | free forever | anyone | commercial ok | 2,000 completions + 50 chat messages/mo · Pro $10/mo unlimited |
| [NVIDIA NIM](#nvidia-nim) | free forever | anyone | check ToS | 5,000 API credits on signup · 40 RPM cap · prototyping only on free |
| [Mistral AI API](#mistral-ai-api) | free forever | anyone | check ToS | Experiment tier ~1B tokens/mo free · then PAYG from $0.10/MTok |
| [ElevenLabs](#elevenlabs) | free forever | anyone | check ToS | 10,000 chars/mo free · 3 custom voices · commercial on paid only |
| [Stability AI](#stability-ai) | credits | anyone | check ToS | 25 free credits on signup · then PAYG · self-host open weights free |

---

## OpenRouter

| Field | Value |
|-------|-------|
| URL | https://openrouter.ai |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Pay-per-token · free-tier models available · set spend caps |
| Tags | llm, startup |

One API for many models — route cheap for drafts, frontier for hard steps.

**Pick this if** you need one API key to access OpenAI, Anthropic, Mistral, and dozens of open models — swap providers without changing code and use free-tier models for dev. **vs Together AI:** OpenRouter aggregates *all* providers (closed + open) behind one endpoint; Together only hosts open-weight models. **vs direct OpenAI/Anthropic:** you trade ~5 % markup for instant fallback routing and cost-ranked model selection.


---

## Groq

| Field | Value |
|-------|-------|
| URL | https://console.groq.com |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | Free quota then PAYG · rate limits apply |
| Tags | llm |

Very fast inference — good for chat/tool loops before you need GPT-class quality.

**Pick this if** your feature is latency-bound (chat loops, tool-calling agents, real-time UX) and you need sub-200 ms TTFT on open models at zero cost during development. **vs OpenRouter:** Groq's custom LPU hardware is faster for the models it supports, but you're limited to its model list; OpenRouter gives breadth. **vs Cerebras:** similar speed story — Groq has a more generous free tier and broader SDK support today.


---

## Google AI Studio

| Field | Value |
|-------|-------|
| URL | https://aistudio.google.com |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | Free quota for experimentation · check commercial ToS |
| Tags | llm, gemini |

Gemini API for prototypes — often the cheapest path to a capable model.

**Pick this if** you need multimodal (text + image + video + audio) in one API call, a 1 M-token context window for large-doc RAG, or simply the most generous free tier among frontier-class models. **vs OpenAI API:** Gemini's free tier lets you prototype without spending a cent; OpenAI has no forever-free option. **vs Anthropic API:** Gemini wins on context length (1 M vs 200 K) and multimodal breadth; Claude wins on agentic tool use and structured reasoning.


---

## Cloudflare Workers AI

| Field | Value |
|-------|-------|
| URL | https://developers.cloudflare.com/workers-ai/ |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Daily free neurons · then usage pricing |
| Tags | llm, edge |

Edge inference next to your Workers — tiny models, low ops.

**Pick this if** your app already runs on Cloudflare Workers and you want inference co-located at the edge with zero cold starts, paying nothing up to 10 K neurons/day. **vs Together AI / Fireworks:** Workers AI runs *inside* your request pipeline (no external HTTP hop), but model selection is smaller and weights are quantized for edge hardware. **vs Replicate:** Workers AI is for lightweight, latency-first inference at the edge; Replicate is for heavier GPU models (image gen, voice) where you can tolerate ~2 s cold starts.


---

## Together AI

| Field | Value |
|-------|-------|
| URL | https://www.together.ai |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | PAYG · occasional free credits via promos |
| Tags | llm |

Open-weight hosting when you want control without self-hosting GPUs.

**Pick this if** you want to run Llama, Mixtral, or other open-weight models via API today with an escape hatch to self-host the same weights on your own GPUs later — no vendor lock-in on the model itself. **vs Fireworks AI:** Together has a wider open-model catalog and fine-tuning support; Fireworks optimizes harder for raw latency on fewer models. **vs OpenRouter:** Together gives you direct open-weight hosting with fine-tune capability; OpenRouter is an aggregator that can't fine-tune or guarantee which backend serves you.


---

## Fireworks AI

| Field | Value |
|-------|-------|
| URL | https://fireworks.ai |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | PAYG · free trial credits often |
| Tags | llm |

Fast open-model inference for product features that don't need Opus.

**Pick this if** you're building a latency-sensitive product feature (autocomplete, inline suggestions, real-time classification) on open models and need consistently fast p95 response times at PAYG rates. **vs Together AI:** Fireworks optimizes inference speed with custom serving infra; Together offers broader model selection and fine-tuning. **vs Groq:** Fireworks is production-grade PAYG with no rate-limit cliffs; Groq is faster but has strict free-tier quotas that break under real traffic.


---

## OpenAI API

| Field | Value |
|-------|-------|
| URL | https://platform.openai.com |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | No forever free · usage billing · project spend limits |
| Tags | llm |

Pay only when cheaper models fail — wire hard budget alerts day one.

**Pick this if** you need frontier-quality reasoning (GPT-4o, o1) as a fallback when open models or Gemini can't cut it — use project-level spend caps to prevent bill shock and route here only for the hard 10 % of prompts. **vs Anthropic API:** OpenAI has wider model range (vision, TTS, DALL·E, embeddings in one account); Anthropic is stronger for agentic multi-step tool use and long-form reasoning. **vs Google AI Studio:** OpenAI has no free tier but often higher benchmark scores on coding and structured output; Gemini wins on cost and context length.


---

## Anthropic API

| Field | Value |
|-------|-------|
| URL | https://console.anthropic.com |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Usage billing · set org spend caps |
| Tags | llm |

Claude for agent/tool use — keep it off the hot path until revenue.

**Pick this if** you're building multi-step agents with complex tool-calling chains and need the model that most reliably follows system prompts, uses tools correctly, and reasons through ambiguous steps. **vs OpenAI API:** Claude excels at long agentic workflows and instruction-following; GPT-4o is better for breadth (image gen, TTS, embeddings all in one platform). **vs Groq/Fireworks:** Anthropic is the quality ceiling for hard reasoning; Groq/Fireworks are for high-volume, latency-sensitive calls where "good enough" open models suffice.


---

## Replicate

| Field | Value |
|-------|-------|
| URL | https://replicate.com |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | PAYG per second · free trial credit windows |
| Tags | ml |

Run public models (vision, voice, image) without owning GPUs.

**Pick this if** you need non-text models (image generation, voice cloning, video, upscaling) from a marketplace of community-published models with per-second billing and zero infra management. **vs Modal:** Replicate is a curated model marketplace you call via API; Modal gives you raw GPU compute to run *your own* code and custom models. **vs Stability AI:** Replicate hosts Stable Diffusion *plus* thousands of other models (ControlNet, Whisper, RIFE); Stability's API is first-party SD only.


---

## Modal

| Field | Value |
|-------|-------|
| URL | https://modal.com |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free credits on signup · then usage |
| Tags | gpu |

Serverless GPU/CPU jobs — batch embeddings and fine-tunes without a cluster.

**Pick this if** you need serverless GPU compute for batch jobs — embedding millions of documents, running fine-tunes, or executing custom model code that doesn't fit a managed inference API. **vs Replicate:** Modal gives you full code control (bring your own Dockerfile, Python, model weights); Replicate is "pick a model from the menu and call it." **vs Unsloth on Colab:** Modal scales to real batch sizes with persistent storage and cron scheduling; Colab is a free notebook that disconnects after idle.


---

## Langfuse

| Field | Value |
|-------|-------|
| URL | https://langfuse.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Generous free cloud · self-host free |
| Tags | observability |

LLM observability — traces, costs, evals before your bill surprises you.

**Pick this if** you want full-stack LLM observability (traces, token costs, prompt versioning, evals) with an open-source core you can self-host when data residency matters. **vs Helicone:** Langfuse gives you deeper eval/dataset tooling and self-host option; Helicone is simpler to adopt (one URL swap) but cloud-only and shallower on evals. **vs LangSmith:** Langfuse is framework-agnostic and open-source; LangSmith is tightly coupled to LangChain and closed-source.


---

## Helicone

| Field | Value |
|-------|-------|
| URL | https://www.helicone.ai |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free tier with request caps |
| Tags | observability |

Proxy for LLM APIs — caching + spend visibility with one base URL swap.

**Pick this if** you want instant cost visibility and response caching across all your LLM calls by swapping a single base URL — zero SDK changes, works with any OpenAI-compatible provider. **vs Langfuse:** Helicone is faster to set up (proxy approach, no SDK instrumentation) and adds caching out of the box; Langfuse is deeper on evals, datasets, and self-hosting. **vs building your own logging:** Helicone gives you dashboards, alerts, rate limiting, and user tracking for free — shipping that yourself burns a sprint.


---

## Mem0

| Field | Value |
|-------|-------|
| URL | https://mem0.ai |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free tier for early agents |
| Tags | agents |

Managed memory layer for agents so you don't reinvent user context stores.

**Pick this if** your agent needs persistent per-user memory (preferences, past interactions, facts) without building your own embedding + retrieval pipeline from scratch. **vs pgvector + custom code:** Mem0 handles memory extraction, deduplication, and decay out of the box; rolling your own means writing and maintaining that logic yourself. **vs LangChain memory modules:** Mem0 is a dedicated managed service with a real API and dashboard; LangChain memory is an in-process abstraction you still need to persist somewhere.


---

## Browserbase

| Field | Value |
|-------|-------|
| URL | https://www.browserbase.com |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free trial / starter caps · then usage |
| Tags | agents |

Hosted browsers for agent scraping/automation without Playwright ops.

**Pick this if** your AI agents need to browse, scrape, or interact with real web pages and you don't want to manage Playwright infrastructure, proxy rotation, or headless Chrome scaling yourself. **vs Browserless:** Browserbase is built specifically for AI agent workflows (session replay, stealth mode, built-in proxies); Browserless is a more general headless Chrome API for PDFs and screenshots. **vs self-hosted Playwright:** Browserbase handles anti-bot evasion, IP rotation, and scaling to hundreds of concurrent sessions — things that take weeks to build reliably on your own infra.


---

## Milvus

| Field | Value |
|-------|-------|
| URL | https://milvus.io |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS · you pay infra · or use Zilliz Cloud free cluster |
| Tags | vector, rag, oss |
| Verified | 2026-07-24 |

Open-source vector DB for RAG at scale — self-host when cloud bills scare you.

**Pick this if** you need a battle-tested open-source vector database you can self-host for full data control, with proven scale to billions of vectors and GPU-accelerated indexing. **vs Pinecone:** Milvus is OSS with no vendor lock-in and unlimited namespaces; Pinecone is easier to start but proprietary and charges for features Milvus gives free. **vs pgvector:** Milvus is purpose-built for vector workloads with better indexing algorithms (IVF, HNSW, DiskANN) and throughput; pgvector is "good enough" when your dataset fits in Postgres and you don't want another dependency.


---

## Zilliz Cloud

| Field | Value |
|-------|-------|
| URL | https://zilliz.com/cloud |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free cluster · 5 GB · 2.5M vCU/mo · 5 collections |
| Tags | vector, rag, milvus |
| Verified | 2026-07-24 |

Managed Milvus — vector search without running etcd/minio yourself.

**Pick this if** you want Milvus's power (scale, hybrid search, GPU indexing) without operating etcd, MinIO, and the coordinator services yourself — a free cluster gets you started with 5 GB. **vs self-hosted Milvus:** same engine, zero ops; you trade cost control for convenience. **vs Pinecone:** Zilliz gives you the full Milvus API (richer filtering, partition keys, GPU index) with an OSS escape hatch; Pinecone is simpler but proprietary.


---

## Qdrant

| Field | Value |
|-------|-------|
| URL | https://qdrant.tech |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free cluster · 1 GB RAM · 4 GB disk · suspends after 1w idle |
| Tags | vector, rag |
| Verified | 2026-07-24 |

Vector search with strong filters — solid free cloud node for prototypes.

**Pick this if** you need vector search with rich payload filtering (numeric ranges, geo, nested JSON) and want a free managed cluster to prototype before committing — Qdrant's Rust core is fast and memory-efficient. **vs Pinecone:** Qdrant is open-source with self-host option and more expressive filtering; Pinecone is marginally simpler but proprietary. **vs Chroma:** Qdrant is production-grade with replication and cloud hosting; Chroma is embedded-first and better for local dev or single-node prototypes.


---

## Chroma

| Field | Value |
|-------|-------|
| URL | https://www.trychroma.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS local free · Chroma Cloud has a free tier (check caps) |
| Tags | vector, rag, oss |
| Verified | 2026-07-24 |

Embedded-first vector store — local RAG before you pay for a cluster.

**Pick this if** you want to add vector search to a prototype with `pip install chromadb` and zero infrastructure — embeddings persist locally, and you can move to Chroma Cloud later without changing your code. **vs pgvector:** Chroma is purpose-built for embeddings with better DX (auto-embedding, metadata filtering); pgvector requires you to manage embedding generation yourself and lives inside Postgres. **vs Qdrant/Pinecone:** Chroma is the fastest path from zero to working RAG on localhost; switch to Qdrant or Pinecone when you need distributed scale or SLA guarantees.


---

## Pinecone

| Field | Value |
|-------|-------|
| URL | https://www.pinecone.io |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Starter free serverless quota · then usage |
| Tags | vector, rag |
| Verified | 2026-07-24 |

Managed vectors with the least ops — fine until egress and namespaces bite.

**Pick this if** you want the lowest-ops vector database experience — create an index, upsert, query, done — and your dataset fits comfortably in the free serverless tier without needing self-host escape hatches. **vs Qdrant:** Pinecone has a slicker onboarding and zero config, but Qdrant gives you open-source portability and richer filtering. **vs pgvector:** Pinecone is faster at scale and purpose-built for similarity search; pgvector avoids an extra service when your vectors are small and already live next to your relational data.


---

## Weaviate

| Field | Value |
|-------|-------|
| URL | https://weaviate.io |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Self-host free · Cloud sandbox/trial then paid |
| Tags | vector, rag, oss |
| Verified | 2026-07-24 |

Hybrid vector + keyword search — OSS core, cloud for zero-ops.

**Pick this if** you need hybrid search (vector + BM25 keyword) in one query and want an open-source core with built-in vectorization modules that call embedding APIs for you. **vs Qdrant:** Weaviate has native hybrid search and auto-vectorization modules; Qdrant requires you to generate embeddings externally and is pure vector. **vs Milvus:** Weaviate is friendlier for small teams (single binary, GraphQL API, module ecosystem); Milvus scales harder for billion-vector workloads.


---

## pgvector

| Field | Value |
|-------|-------|
| URL | https://github.com/pgvector/pgvector |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS extension · limited by your Postgres plan storage/CPU |
| Tags | vector, rag, postgres, oss |
| Verified | 2026-07-24 |

Vectors inside Postgres — keep RAG next to Neon/Supabase until you outgrow it.

**Pick this if** you already run Postgres (Neon, Supabase, RDS) and want vector search without adding another service — your embeddings live in the same DB as your app data, with transactions and joins for free. **vs Pinecone/Qdrant:** pgvector avoids a new dependency and bill; dedicated vector DBs outperform it past ~1 M vectors or when you need advanced indexing (IVF-PQ, DiskANN). **vs Chroma:** pgvector keeps everything in one database you already operate; Chroma is better for rapid local prototyping when you don't have Postgres set up yet.


---

## Cohere

| Field | Value |
|-------|-------|
| URL | https://cohere.com |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | Free trial keys · rate limits · then PAYG |
| Tags | embeddings, rerank |
| Verified | 2026-07-24 |

Embeddings + rerank that often beat generic LLM embeds for retrieval.

**Pick this if** your RAG pipeline's retrieval quality is the bottleneck and you want best-in-class embeddings plus a reranker endpoint that dramatically improves top-K precision without changing your vector DB. **vs Voyage AI:** Cohere bundles embeddings *and* rerank in one platform; Voyage has stronger embedding benchmarks but no reranker. **vs OpenAI embeddings:** Cohere's embed-v3 models are multilingual and retrieval-optimized by design; OpenAI's ada-002 is general-purpose and often weaker for search tasks.


---

## Hugging Face Inference

| Field | Value |
|-------|-------|
| URL | https://huggingface.co/inference-api |
| Cost | credits |
| Student | anyone |
| Commercial | check ToS |
| Limits | Free CPU quota · paid for speed/GPU · model licenses vary |
| Tags | llm, embeddings |
| Verified | 2026-07-24 |

Hosted open models + embeddings without owning a GPU box.

**Pick this if** you want access to the largest catalog of open models (100 K+) with a unified Inference API and free CPU-tier access for experimentation — deploy any model from the Hub without managing infrastructure. **vs Together AI / Fireworks:** HF Inference has the broadest model selection (including niche fine-tunes); Together/Fireworks are faster and cheaper for the popular models they curate. **vs Replicate:** HF is better for text/embedding models from the Hub; Replicate's strength is media models (image, video, audio) with per-second billing.


---

## Cerebras Inference

| Field | Value |
|-------|-------|
| URL | https://inference.cerebras.ai |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | Free tier with rate limits · then paid |
| Tags | llm |
| Verified | 2026-07-24 |

Very fast open-weight inference — useful when Groq quotas run dry.

**Pick this if** you need Groq-class speed on open models and want a second fast-inference provider to failover to when Groq's rate limits hit — Cerebras's wafer-scale chips deliver similar TTFT. **vs Groq:** both are ultra-fast; Groq has a more mature free tier and wider model support today, so use Cerebras as your secondary or when Groq is at capacity. **vs Fireworks/Together:** Cerebras is optimized purely for speed (like Groq); Fireworks/Together offer broader model catalogs and fine-tuning at moderate speed.


---

## DeepSeek API

| Field | Value |
|-------|-------|
| URL | https://platform.deepseek.com |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Low PAYG rates · occasional promo credit · check ToS region |
| Tags | llm |
| Verified | 2026-07-24 |

Cheap capable chat/code models — strong budget default for agents.

**Pick this if** you want GPT-4-class reasoning and code generation at a fraction of OpenAI's price — DeepSeek's models punch well above their cost tier and work great as a default for agent inner loops. **vs OpenAI API:** DeepSeek is 10–50× cheaper per token with competitive quality on code/reasoning; OpenAI has better ecosystem tooling and more consistent uptime. **vs Groq on Llama:** DeepSeek's own models (V3, R1) are stronger than Llama-hosted-on-Groq for complex tasks; Groq is faster but limited to models it supports.


---

## LangSmith

| Field | Value |
|-------|-------|
| URL | https://www.langchain.com/langsmith |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free Developer plan with trace caps |
| Tags | observability, agents |
| Verified | 2026-07-24 |

LangChain tracing/evals — free developer seat before you need org plans.

**Pick this if** you're already using LangChain/LangGraph and want first-party tracing, prompt playgrounds, and evaluation datasets with zero integration friction — the free Developer plan covers solo projects. **vs Langfuse:** LangSmith has tighter LangChain integration and a more polished eval UI; Langfuse is framework-agnostic, open-source, and self-hostable. **vs Helicone:** LangSmith goes deeper on evals and datasets; Helicone is lighter-weight and provider-agnostic (just a proxy swap).


---

## Ollama

| Field | Value |
|-------|-------|
| URL | https://ollama.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS · your GPU/CPU · model licenses vary |
| Tags | llm, local, oss |
| Verified | 2026-07-24 |

Local LLMs on your machine — true $0 inference for drafts and offline work.

**Pick this if** you want zero-cost, fully private inference on your own hardware — no API keys, no rate limits, no data leaving your machine — and you're fine with open-weight model quality. **vs Groq:** Ollama is truly free with no quotas but limited by your local GPU; Groq is faster and runs larger models but has rate limits and requires internet. **vs LM Studio:** Ollama is CLI-first and daemon-based (great for scripts, CI, and server use); LM Studio adds a GUI for model browsing and chat — use both together.


---

## LM Studio

| Field | Value |
|-------|-------|
| URL | https://lmstudio.ai |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | Free app · model licenses vary |
| Tags | llm, local |
| Verified | 2026-07-24 |

GUI local models + OpenAI-compatible server — good teammate to Ollama.

**Pick this if** you want a desktop GUI to browse, download, and chat with local models *plus* an OpenAI-compatible local server your apps can hit at `localhost:1234` — ideal for non-CLI teammates or visual model comparison. **vs Ollama:** LM Studio has a polished GUI and model discovery UX; Ollama is lighter, scriptable, and better for headless/server environments. Use LM Studio for interactive exploration, Ollama for automation. **vs cloud APIs:** LM Studio is $0 forever with full privacy, but quality caps at whatever fits in your VRAM.


---

## Voyage AI

| Field | Value |
|-------|-------|
| URL | https://www.voyageai.com |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free tokens on signup · then PAYG |
| Tags | embeddings |
| Verified | 2026-07-24 |

Strong embeddings API when retrieval quality matters more than chat.

**Pick this if** retrieval precision is your primary bottleneck and you want embeddings that consistently top MTEB benchmarks for search — Voyage models are purpose-built for retrieval, not general-purpose. **vs Cohere:** Voyage often leads on raw embedding quality benchmarks; Cohere bundles a reranker you'd need to add separately with Voyage. **vs Together Embeddings:** Voyage is a specialized embeddings company with top-tier quality; Together offers open-weight embeddings that are cheaper and let you self-host the same model later.


---

## Together Embeddings

| Field | Value |
|-------|-------|
| URL | https://www.together.ai |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | PAYG · promo credits sometimes |
| Tags | embeddings |
| Verified | 2026-07-24 |

Open-weight embeddings via Together — cheaper RAG than closed APIs.

**Pick this if** you want good embeddings at low cost with the guarantee that you can download the same open weights and self-host later — no vendor lock-in on your vector pipeline. **vs Voyage AI:** Together embeddings are cheaper and open-weight (self-host escape hatch); Voyage has higher retrieval quality on benchmarks but is proprietary and pricier. **vs OpenAI ada-002:** Together's open models (e.g., BGE, E5) often match or beat ada-002 on retrieval tasks at lower per-token cost, and you own the weights.


---

## Vercel AI SDK

| Field | Value |
|-------|-------|
| URL | https://sdk.vercel.ai |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS SDK free · inference cost = your provider |
| Tags | sdk, pattern |
| Verified | 2026-07-24 |

Pattern/library for streaming UI — not a free model tier. Bring your own keys.

**Pick this if** you're building a Next.js/React app with streaming AI responses and want a provider-agnostic SDK that handles streaming, tool calls, and structured output with one unified API across OpenAI, Anthropic, Google, and open models. **vs rolling your own fetch + SSE:** the AI SDK handles backpressure, structured output parsing, tool-call orchestration, and React hooks — saving you weeks of plumbing. **vs LangChain JS:** Vercel AI SDK is lighter, frontend-focused, and TypeScript-native; LangChain is heavier and better for complex backend chains/agents.


---

## Continue.dev

| Field | Value |
|-------|-------|
| URL | https://continue.dev |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS · your model backend |
| Tags | ide, oss |
| Verified | 2026-07-24 |

Open-source coding assistant in the IDE — point at Ollama or cheap APIs.

**Pick this if** you want a free, open-source Copilot alternative that works with *any* backend — point it at Ollama for $0 local completions, or at Groq/Together for cheap cloud inference, all without paying $10–20/mo for a proprietary IDE tool. **vs GitHub Copilot:** Continue is free, open-source, and backend-agnostic; Copilot is polished but proprietary, $10/mo, and locked to OpenAI models. **vs Cursor/Windsurf:** Continue is an extension for your existing VS Code/JetBrains setup; Cursor and Windsurf are separate editors you'd have to switch to.


---

## Tavily

| Field | Value |
|-------|-------|
| URL | https://tavily.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | ~1k API credits/mo free class |
| Tags | agents, search |
| Verified | 2026-07-24 |

Web search API shaped for agents — structured results, not HTML soup.

**Pick this if** your agent needs real-time web search results as structured JSON (title, URL, content snippet) without parsing HTML — purpose-built for LLM tool-calling with ~1 K free searches/month. **vs Exa:** Tavily returns traditional search-style results optimized for factual grounding; Exa uses neural search for semantic similarity (better for "find pages *like* this"). **vs SerpAPI / raw Google:** Tavily extracts clean content and scores relevance for you; raw search APIs return link lists you'd have to scrape and parse yourself.


---

## Exa

| Field | Value |
|-------|-------|
| URL | https://exa.ai |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free signup credits · then PAYG |
| Tags | agents, search |
| Verified | 2026-07-24 |

Neural web search for RAG/agents when keyword search is too dumb.

**Pick this if** you need semantic web search — find pages by *meaning* rather than keyword match — which is ideal for RAG pipelines, research agents, and "find similar" features where traditional search returns irrelevant noise. **vs Tavily:** Exa uses neural embeddings for semantic matching (better for conceptual queries); Tavily is closer to traditional search (better for factual lookups like "current price of X"). **vs building your own scraper + embeddings:** Exa indexes the web for you and returns content — no crawling, no chunking, no vector DB needed for web knowledge.


---

## LlamaIndex

| Field | Value |
|-------|-------|
| URL | https://www.llamaindex.ai |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS framework free · you pay model/vector backends |
| Tags | rag, oss |
| Verified | 2026-07-24 |

Data framework for RAG — wire docs/DBs into LLMs without reinventing chunking.

**Pick this if** you're building a RAG pipeline and want a framework that handles document loading, chunking, indexing, retrieval, and synthesis — batteries-included with 150+ data connectors. **vs Vercel AI SDK:** LlamaIndex is for the *data/retrieval* layer (ingestion, indexing, querying); Vercel AI SDK is for the *UI/streaming* layer. They complement each other. **vs LangChain:** LlamaIndex is more opinionated and data-focused (better for RAG); LangChain is broader and more flexible (better for complex agent graphs and arbitrary chains).


---

## Unsloth

| Field | Value |
|-------|-------|
| URL | https://unsloth.ai |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS · runs on free Colab T4 class GPUs |
| Tags | oss, finetune |
| Verified | 2026-07-24 |

Fast low-memory LLM fine-tuning — Colab-friendly open weights path.

**Pick this if** you want to fine-tune open-weight LLMs (Llama, Mistral, Gemma) 2× faster with 60 % less VRAM — runs on free Colab T4 GPUs, making fine-tuning accessible without paying for A100s. **vs Modal:** Unsloth is an optimization library you run anywhere (Colab, local, Modal); Modal is the compute platform. Use Unsloth *on* Modal for the best of both. **vs full-fat HuggingFace Trainer:** Unsloth patches the training loop for dramatic speed/memory gains with zero code changes to your existing training scripts.


---

## Browserless

| Field | Value |
|-------|-------|
| URL | https://www.browserless.io |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free/starter unit caps · then usage |
| Tags | browser, agents |
| Verified | 2026-07-24 |

Headless Chrome API for PDFs, scrapes, screenshots — less Playwright ops.

**Pick this if** you need headless Chrome as a service for generating PDFs, taking screenshots, or scraping pages — simpler API than full Playwright, with managed scaling and a free starter tier. **vs Browserbase:** Browserless is better for straightforward Chrome tasks (PDF gen, screenshots, simple scrapes); Browserbase is built for complex AI agent browsing with stealth, sessions, and anti-bot evasion. **vs self-hosted Playwright:** Browserless handles Chrome lifecycle, memory leaks, and concurrency scaling; self-hosting means you manage zombie processes and OOM kills yourself.


---

## Flowise

| Field | Value |
|-------|-------|
| URL | https://flowiseai.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS self-host · or npx · you pay models |
| Tags | oss, agents, rag |
| Verified | 2026-07-24 |

Drag-drop LLM/RAG builders — self-host visual agent graphs.

**Pick this if** you want to visually prototype LLM chains, RAG pipelines, and agent graphs with drag-and-drop — self-host with `npx flowise start` and iterate without writing orchestration code. **vs LangChain code:** Flowise gives non-coders and rapid prototypers a visual canvas backed by LangChain under the hood; switch to code when you need version control and tests. **vs LlamaIndex:** Flowise is a visual builder for wiring components; LlamaIndex is a code framework for data ingestion and retrieval — use Flowise *with* LlamaIndex nodes for the best of both.


---

## Kiro

| Field | Value |
|-------|-------|
| URL | https://kiro.dev |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 50 credits/mo free · Pro $20/mo 1,000 credits · 500 bonus on first 14d |
| Tags | ide, agents |
| Verified | 2026-08-01 |

AWS agentic IDE — spec-driven dev with autopilot hooks and steering files.

**Pick this if** you want spec-driven development with an AI agent that follows structured requirements (specs, hooks, steering files) rather than ad-hoc chat — 50 free interactions/month gets you started on real projects. **vs Cursor:** Kiro is spec-driven and structured (requirements → design → implementation); Cursor is more free-form chat-and-edit. Kiro suits teams that want reproducible AI workflows. **vs Amazon Q Developer:** Kiro is a standalone IDE with agentic autonomy; Q Developer is an assistant *inside* your existing IDE — different philosophies on who drives.


---

## Amazon Q Developer

| Field | Value |
|-------|-------|
| URL | https://aws.amazon.com/q/developer/ |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free Individual tier · Pro $19/mo for expanded limits |
| Tags | ide, aws |
| Verified | 2026-08-01 |

AWS AI code assistant — inline completions, chat, and agentic transforms.

**Pick this if** you work primarily in the AWS ecosystem and want an AI assistant that understands IAM policies, CDK constructs, and AWS APIs natively — free Individual tier with no credit card. **vs GitHub Copilot:** Q Developer has deeper AWS-specific knowledge (IAM, CloudFormation, SDK patterns); Copilot is better for general-purpose code across all ecosystems. **vs Kiro:** Q Developer is an assistant inside VS Code/JetBrains; Kiro is a full IDE with autonomous spec-driven workflows — Q is a copilot, Kiro is an autopilot.


---

## Cursor

| Field | Value |
|-------|-------|
| URL | https://www.cursor.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Hobby free: 2,000 completions/mo · Pro $20/mo usage-based |
| Tags | ide |
| Verified | 2026-08-01 |

AI-native code editor — Tab, Cmd-K, and agent mode for multi-file edits.

**Pick this if** you want the most polished AI-native editor experience — Tab completions that predict multi-line edits, Cmd-K inline generation, and an agent mode that can refactor across files autonomously. Free Hobby tier gives 2,000 completions/month. **vs Windsurf:** Cursor's Tab and Cmd-K feel faster for surgical edits; Windsurf's Cascade is better for longer autonomous sessions. Try both — switching cost is low. **vs GitHub Copilot:** Cursor offers deeper agentic features (multi-file agent, codebase-aware context); Copilot is cheaper ($10/mo) and stays inside VS Code without a separate app.


---

## Windsurf

| Field | Value |
|-------|-------|
| URL | https://windsurf.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free: ~25 Flow Actions/mo + unlimited autocomplete · Pro $20/mo |
| Tags | ide |
| Verified | 2026-08-01 |

Flow-state AI IDE (ex-Codeium) — Cascade agent for autonomous multi-file tasks.

**Pick this if** you want an AI IDE that excels at longer autonomous tasks — Cascade mode plans and executes multi-step, multi-file changes with less hand-holding than competitors, plus unlimited free autocomplete. **vs Cursor:** Windsurf's Cascade is more autonomous for big refactors; Cursor's Tab/Cmd-K is snappier for quick inline edits. Windsurf's free tier includes unlimited autocomplete (Cursor caps at 2 K). **vs Kiro:** Windsurf is flow-state and conversational; Kiro is spec-driven with formal requirements. Windsurf suits exploratory coding, Kiro suits structured projects.


---

## GitHub Copilot Free

| Field | Value |
|-------|-------|
| URL | https://github.com/features/copilot |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 2,000 completions + 50 chat messages/mo · Pro $10/mo unlimited |
| Tags | ide |
| Verified | 2026-08-01 |

AI pair programmer in VS Code — no credit card, just a GitHub account.

**Pick this if** you want AI completions with zero friction — sign in with GitHub, get 2,000 completions and 50 chat messages/month for free, no app switch required. The lowest barrier to AI-assisted coding. **vs Cursor:** Copilot Free stays inside VS Code with no context switching; Cursor is a separate app but has deeper agentic features. Copilot Pro at $10/mo is also half the price of Cursor Pro. **vs Continue.dev:** Copilot is polish and convenience (zero setup); Continue is freedom and flexibility (any model, any backend, open-source).


---

## NVIDIA NIM

| Field | Value |
|-------|-------|
| URL | https://build.nvidia.com |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | 5,000 API credits on signup · 40 RPM cap · prototyping only on free |
| Tags | llm, gpu |
| Verified | 2026-08-01 |

100+ frontier models free via NVIDIA Developer — OpenAI-compatible, no card.

**Pick this if** you want to prototype with 100+ models (Llama, Mistral, Gemma, Nemotron) for free via an OpenAI-compatible API — 5,000 credits on signup, no credit card, useful for quick benchmarking across models. **vs OpenRouter:** NIM is free for prototyping with generous credits; OpenRouter is pay-per-token but production-grade with better routing and fallback. **vs Together AI:** NIM is for free experimentation (40 RPM cap, not production); Together is PAYG with production SLAs and fine-tuning support.


---

## Mistral AI API

| Field | Value |
|-------|-------|
| URL | https://console.mistral.ai |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | Experiment tier ~1B tokens/mo free · then PAYG from $0.10/MTok |
| Tags | llm |
| Verified | 2026-08-01 |

Strong open-weight and proprietary models — generous free Experiment tier.

**Pick this if** you want a European AI provider with a massive free Experiment tier (~1 B tokens/month), strong coding models (Codestral), and both open-weight and proprietary options — good for EU data residency requirements. **vs Groq:** Mistral's free tier has far higher token limits; Groq is faster but with stricter rate limits. Mistral also offers its own proprietary models (Large, Medium) not available elsewhere. **vs OpenAI API:** Mistral is significantly cheaper (PAYG from $0.10/MTok vs $2.50+) with competitive quality on many tasks; OpenAI wins on frontier reasoning benchmarks.


---

## ElevenLabs

| Field | Value |
|-------|-------|
| URL | https://elevenlabs.io |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | 10,000 chars/mo free · 3 custom voices · commercial on paid only |
| Tags | voice, tts |
| Verified | 2026-08-01 |

Best-in-class TTS and voice cloning — free tier for prototyping audio.

**Pick this if** you need the most natural-sounding text-to-speech or voice cloning for your app — 10,000 characters/month free lets you prototype audio features before committing to a paid plan. **vs OpenAI TTS:** ElevenLabs has more natural prosody, voice cloning, and 30+ languages; OpenAI TTS is simpler (one API call) but fewer voices and no cloning on the free tier. **vs self-hosted Coqui/Bark:** ElevenLabs is dramatically higher quality with zero infra; open-source TTS requires GPU hosting and sounds noticeably worse.


---

## Stability AI

| Field | Value |
|-------|-------|
| URL | https://stability.ai |
| Cost | credits |
| Student | anyone |
| Commercial | check ToS |
| Limits | 25 free credits on signup · then PAYG · self-host open weights free |
| Tags | image, diffusion |
| Verified | 2026-08-01 |

Stable Diffusion API for image gen — signup credits to start.

**Pick this if** you need image generation via API (product shots, illustrations, variations) and want both a managed API with signup credits *and* the option to self-host the same open weights for free on your own GPU. **vs Replicate:** Stability's API is first-party with latest SD models immediately; Replicate hosts community forks that may lag or diverge. **vs DALL·E (OpenAI):** Stability is cheaper per image, open-weight (self-host escape hatch), and offers more control (ControlNet, inpainting, upscaling); DALL·E is simpler and better at prompt adherence for non-technical users.


---
