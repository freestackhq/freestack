# freestack.

> **BLUF**: Directory of free developer tools, student unlocks, free public APIs, and self-hosted software — with hard limits, eligibility, and commercial permissions. No marketing vibes, numbers first.

* **Live Site**: [freestack.kuyacarlo.dev](https://freestack.kuyacarlo.dev)
* **Dataset**: 336 entries across 58 categories in 4 catalogs (`saas`, `selfhosted`, `apis`, `llm-ai`).
* **AI & GEO Endpoints**: [`/llms.txt`](https://freestack.kuyacarlo.dev/llms.txt) and [`/llms-full.txt`](https://freestack.kuyacarlo.dev/llms-full.txt).
* **Stack**: Astro 5, Tailwind CSS v4, Cloudflare Workers runtime (`@astrojs/cloudflare`).

---

## Catalogs & Architecture

Catalogs live directly in-repo under [`catalogs/`](catalogs/) (with `selfhosted` maintained as an external repository).

| Catalog | Source Path | Scope | Format |
|---|---|---|---|
| **SaaS** | [`catalogs/saas/`](catalogs/saas/) | Free developer cloud tiers & student unlocks | Markdown (17 categories) |
| **APIs** | [`catalogs/apis/`](catalogs/apis/) | Free public APIs with auth & rate limits | Markdown (6 categories) |
| **LLM & AI** | [`catalogs/llm-ai/`](catalogs/llm-ai/) | Free inference, embeddings, local models | Markdown (5 categories) |
| **Self-Hosted** | [`freestackhq/selfhosted`](https://github.com/freestackhq/selfhosted) | Self-hosted software comparison matrix | Markdown (30 categories) |

Data is compiled into a committed snapshot at [`src/data/catalog.generated.json`](src/data/catalog.generated.json) so offline builds and tests work out of the box.

---

## Quickstart

```bash
pnpm install
pnpm dev              # local workerd runtime
pnpm catalog:update   # parse catalogs/* and rebuild snapshot
pnpm test             # run Vitest unit test suite (32 tests)
pnpm build            # build static assets and worker bundle
pnpm deploy:cf        # build and deploy to Cloudflare Workers
```

---

## Adding or Updating a Tool

1. Create or edit the category Markdown file inside [`catalogs/<catalog>/`](catalogs/).
2. For new categories, copy [`catalogs/_template.md`](catalogs/_template.md).
3. Follow the standard section shape:
   * Frontmatter: `category`, `description`
   * `## Comparison Matrix` table
   * `## <Entry>` section with `| Field | Value |` table, `**Pick this if**`, and `**vs X**` lines.
4. Run `pnpm catalog:update` to refresh [`src/data/catalog.generated.json`](src/data/catalog.generated.json).
5. Run `pnpm test` to verify the snapshot.

---

## API & AI Endpoints

Base URL: `https://freestack.kuyacarlo.dev` (CORS open).

| Endpoint | Method | Purpose |
|---|---|---|
| `/llms.txt` | `GET` | Standard LLM navigation and catalog manifest |
| `/llms-full.txt` | `GET` | Full plain-text digest of all 336 tools for LLM ingestion |
| `/api/health` | `GET` | Health status, version, and catalog counts |
| `/api/catalogs` | `GET` | Available catalogs, categories, and entry counts |
| `/api/entries` | `GET, POST` | Filter/search tools (`catalog`, `category`, `q`, field filters, `limit`) |
| `/api/openapi.json` | `GET` | OpenAPI 3.1.0 specification |
| [`/docs`](https://freestack.kuyacarlo.dev/docs) | `GET` | Interactive Scalar API documentation |

---

## CLI

Package: [`packages/cli`](packages/cli) → `@kuyacarlo/freestack`

```bash
pnpm dlx @kuyacarlo/freestack claim --student --commercial
pnpm dlx @kuyacarlo/freestack tools --category ai --commercial yes
pnpm dlx @kuyacarlo/freestack tool neon
```

---

## License

MIT License. Catalog content is public reference data.
