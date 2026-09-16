# freestack

Directory of free developer tools, student unlocks, free public APIs, and AI models — with hard limits, eligibility, and commercial permissions. Numbers first.

* **Live**: [freestack.kuyacarlo.dev](https://freestack.kuyacarlo.dev)
* **Coverage**: 222 entries across 28 categories in 3 catalogs
* **GEO & AI**: [`/llms.txt`](https://freestack.kuyacarlo.dev/llms.txt) · [`/llms-full.txt`](https://freestack.kuyacarlo.dev/llms-full.txt)
* **Stack**: Astro, Tailwind CSS v4, Cloudflare Workers runtime

---

## Quickstart

```bash
pnpm install
pnpm dev              # local workerd runtime
pnpm test             # run unit test suite (Vitest)
pnpm build            # build static assets + server bundle
pnpm deploy:cf        # build and deploy to Cloudflare Workers
```

---

## Catalogs & Content

Catalogs live directly in-repo under [`catalogs/`](catalogs/).

| Catalog | Source | Scope | Entries |
|---|---|---|---|
| **SaaS** | [`catalogs/saas/`](catalogs/saas/) | Free developer SaaS tiers & student unlocks | 187 across 17 categories |
| **APIs** | [`catalogs/apis/`](catalogs/apis/) | Free public APIs with auth & rate limits | 18 across 6 categories |
| **LLM & AI** | [`catalogs/llm-ai/`](catalogs/llm-ai/) | Free inference, embeddings, local models | 17 across 5 categories |

### Adding or Updating Entries

1. Edit the category file in [`catalogs/<catalog>/`](catalogs/) or copy [`catalogs/_template.md`](catalogs/_template.md) for new categories.
2. Ensure standard structure: YAML frontmatter, comparison table, entry fields (`URL`, `Cost`, `Limits`, `Commercial`), and `Pick this if` criteria.
3. Run `pnpm catalog:update` to regenerate the committed snapshot.

---

## API & AI Endpoints

Base URL: `https://freestack.kuyacarlo.dev` (CORS open).

| Endpoint | Method | Purpose |
|---|---|---|
| `/llms.txt` | `GET` | Standard LLM navigation and catalog manifest |
| `/llms-full.txt` | `GET` | Full plain-text digest of all 222 tools for AI ingestion |
| `/api/health` | `GET` | Service status, version, and catalog counts |
| `/api/catalogs` | `GET` | Catalog metadata, categories, and entry counts |
| `/api/entries` | `GET, POST` | Filter and search entries (`catalog`, `category`, `q`, fields, `limit`) |
| `/api/openapi.json` | `GET` | OpenAPI 3.1.0 specification |
| [`/docs`](https://freestack.kuyacarlo.dev/docs) | `GET` | Interactive Scalar API documentation |

---

## Architecture & Data Pipeline

Data is compiled from Markdown into a committed snapshot ([`src/data/catalog.generated.json`](src/data/catalog.generated.json)) so builds and test suites run offline without runtime network dependencies.

```bash
pnpm catalog:generate   # parse local catalogs/ into src/data/catalog.generated.json
pnpm catalog:update     # refresh and generate in one step
```

---

## CLI

Package: [`packages/cli`](packages/cli) → `@kuyacarlo/freestack`

```bash
pnpm dlx @kuyacarlo/freestack claim --student --commercial
pnpm dlx @kuyacarlo/freestack tools --category ai --commercial yes
pnpm dlx @kuyacarlo/freestack tool neon
```

---

## Talks & Materials

Marp workshop slide decks live in [`talks/`](talks/).

---

## License

MIT License. Catalog content is public reference data.
