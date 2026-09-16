---
category: Local
description: Run LLMs locally on your own hardware — zero API cost, zero rate limits
---

# Local

## Comparison Matrix

| Service | Auth | Free Tier | Models | OpenAI-compatible | Status |
|---------|------|-----------|--------|-------------------|--------|
| [Ollama](#ollama) | none | completely free (OSS) | 100+ open-weight models | ✓ | active |
| [LM Studio](#lm-studio) | none | free app | GGUF models from HuggingFace | ✓ | active |
| [llama.cpp](#llamacpp) | none | completely free (OSS) | any GGUF model | ✓ (via server mode) | active |

---

## Ollama

| Field | Value |
|-------|-------|
| API Base | http://localhost:11434/v1 |
| Docs | https://github.com/ollama/ollama/blob/main/docs/api.md |
| Auth | none |
| Free Tier | completely free, unlimited, open source |
| Models | Llama 3.3, Qwen 2.5, Mistral, Phi-4, DeepSeek, Gemma 3, CodeLlama, etc. |
| OpenAI-compatible | ✓ |
| Streaming | ✓ |
| Self-host | ✓ (it IS self-hosted) |
| Status | active |

The simplest way to run LLMs locally. One binary, `ollama pull llama3.3` and you're inferencing. Manages model downloads, quantization selection, and exposes an OpenAI-compatible API. Works on macOS (Metal), Linux (CUDA/CPU), Windows.

**Pick this if** you want the easiest path to local LLMs with zero configuration and OpenAI SDK compatibility.

**vs LM Studio** — Ollama is CLI-first and scriptable; LM Studio is GUI-first with a nice chat interface. Both expose the same OpenAI-compatible server.

---

## LM Studio

| Field | Value |
|-------|-------|
| API Base | http://localhost:1234/v1 |
| Docs | https://lmstudio.ai/docs |
| Auth | none |
| Free Tier | free application, unlimited local inference |
| Models | any GGUF model from HuggingFace (browse + download in-app) |
| OpenAI-compatible | ✓ |
| Streaming | ✓ |
| Self-host | ✓ |
| Status | active |

Desktop GUI for running local LLMs. Browse/download models from HuggingFace, adjust parameters visually, and run an OpenAI-compatible local server. Nice for experimentation and non-CLI users.

**Pick this if** you prefer a GUI for model management and want to easily compare different models in a chat interface.

**vs Ollama** — Better UX for exploration and comparing models; Ollama is better for scripting, automation, and server deployments.

---

## llama.cpp

| Field | Value |
|-------|-------|
| API Base | http://localhost:8080/v1 (server mode) |
| Docs | https://github.com/ggerganov/llama.cpp |
| Auth | none |
| Free Tier | completely free, open source |
| Models | any GGUF-format model |
| OpenAI-compatible | ✓ (via `llama-server`) |
| Streaming | ✓ |
| Self-host | ✓ |
| Status | active |

The foundational C++ inference engine that Ollama and LM Studio are built on. Direct control over quantization, context length, batch size, GPU layers. Maximum performance tuning at the cost of more manual setup.

**Pick this if** you need maximum control over inference parameters, custom builds, or are embedding inference into a larger system.

**vs Ollama** — llama.cpp is the engine; Ollama wraps it with model management and ease-of-use. Use llama.cpp directly for custom builds or performance tuning.
