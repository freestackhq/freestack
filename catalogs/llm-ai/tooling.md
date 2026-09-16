---
category: Tooling
description: Developer tools, SDKs, and frameworks for building AI applications
---

# Tooling

## Comparison Matrix

| Service | Auth | Free Tier | Models | OpenAI-compatible | Status |
|---------|------|-----------|--------|-------------------|--------|
| [Vercel AI SDK](#vercel-ai-sdk) | none | OSS library (free forever) | bring-your-own | ✓ (multi-provider) | active |
| [Continue.dev](#continuedev) | none | OSS extension (free forever) | bring-your-own (Ollama, APIs) | ✓ | active |
| [Mem0](#mem0) | api-key | free tier for early agents | memory layer | ✓ (via SDK) | active |

---

## Vercel AI SDK

| Field | Value |
|-------|-------|
| API Base | N/A (client library) |
| Docs | https://sdk.vercel.ai |
| Auth | none (OSS) |
| Free Tier | completely free, open source |
| Models | any provider (OpenAI, Anthropic, Google, Groq, Ollama, etc.) |
| OpenAI-compatible | ✓ (multi-provider abstraction) |
| Streaming | ✓ |
| Self-host | ✓ (it's a library) |
| Status | active |

TypeScript SDK for building AI-powered UIs with streaming, tool calling, and structured output. Provider-agnostic: one interface for OpenAI, Anthropic, Google, Groq, Ollama, and more. React/Next.js hooks for streaming chat UI.

**Pick this if** you're building AI features in a Next.js/React app and want streaming UI with provider switching.

**vs Continue.dev** — Different tools. AI SDK is for building AI into your app; Continue.dev is an AI assistant in your IDE.

---

## Continue.dev

| Field | Value |
|-------|-------|
| API Base | N/A (IDE extension) |
| Docs | https://docs.continue.dev |
| Auth | none (OSS) |
| Free Tier | completely free, open source |
| Models | Ollama, OpenAI, Anthropic, Groq, any OpenAI-compatible endpoint |
| OpenAI-compatible | ✓ (connects to any compatible endpoint) |
| Streaming | ✓ |
| Self-host | ✓ (point at local Ollama) |
| Status | active |

Open-source AI code assistant for VS Code and JetBrains. Point it at Ollama for $0 code completion and chat, or use any API provider. Tab autocomplete, inline editing, chat with codebase context.

**Pick this if** you want a free GitHub Copilot alternative that works with local models or cheap API providers.

**vs Vercel AI SDK** — Continue.dev is an IDE tool for your workflow; AI SDK is a library for building AI features into apps.

---

## Mem0

| Field | Value |
|-------|-------|
| API Base | https://api.mem0.ai/v1 |
| Docs | https://docs.mem0.ai |
| Auth | api-key |
| Free Tier | free tier for early-stage agents |
| Models | N/A (memory layer for agents) |
| OpenAI-compatible | ✓ (via SDK integration) |
| Streaming | ✗ |
| Self-host | ✓ (open source) |
| Status | active |

Managed memory layer for AI agents. Stores user context, preferences, and conversation history so agents remember across sessions. Self-hostable or use their cloud.

**Pick this if** you're building agents that need to remember user context across sessions without reinventing memory storage.

**vs Langfuse** — Different layer. Mem0 is memory (what to remember); Langfuse is observability (what happened).
