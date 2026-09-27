# freestack

Freestack helps founders, students, and hobbyists find tools they can afford and use safely. It surfaces limits, eligibility, commercial permissions, and alternatives so visitors can launch an MVP, publish a portfolio project, or choose what to run themselves.

* **Live**: [freestack.kuyacarlo.dev](https://freestack.kuyacarlo.dev)
* **Coverage**: 223 entries across 28 categories in 3 catalogs (committed local snapshot)
* **GEO & AI**: [`/llms.txt`](https://freestack.kuyacarlo.dev/llms.txt) · [`/llms-full.txt`](https://freestack.kuyacarlo.dev/llms-full.txt)
* **Stack**: Astro, Tailwind CSS v4, Cloudflare Workers runtime

---

## Quickstart

```bash
pnpm install
pnpm dev              # local workerd runtime
pnpm test             # run unit test suite (Vitest)
pnpm test:e2e         # run browser journeys (Playwright)
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
| **LLM & AI** | [`catalogs/llm-ai/`](catalogs/llm-ai/) | Free inference, embeddings, local models | 18 across 5 categories |

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
| `/llms-full.txt` | `GET` | Full plain-text digest of all 223 tools for AI ingestion |
| `/api/health` | `GET` | Service status, version, and catalog counts |
| `/api/catalogs` | `GET` | Catalog metadata, categories, and entry counts |
| `/api/entries` | `GET, POST` | Filter and search entries (`catalog`, `category`, `q`, fields, `limit`) |
| `/api/openapi.json` | `GET` | OpenAPI 3.1.0 specification |
| [`/docs`](https://freestack.kuyacarlo.dev/docs) | `GET` | Interactive Scalar API documentation |

---

## Architecture & Data Pipeline

Data is compiled from Markdown into a committed snapshot ([`src/data/catalog.generated.json`](src/data/catalog.generated.json)) so builds and test suites run offline without runtime network dependencies.

See [`SPEC.md`](SPEC.md) for the product contract, [`DESIGN.md`](DESIGN.md) for visual rules, and [`docs/redesign.md`](docs/redesign.md) for the current release boundary and follow-up roadmap.

## Start from your project

- **Founder**: [Launch a lean MVP](src/pages/guides/startup.astro) and check commercial terms and limits.
- **Student**: [Publish a portfolio project](src/pages/guides/portfolio.astro) with a working demo and clear project notes.
- **Hobbyist**: [Choose cloud or self-hosted tools](src/pages/guides/hobby.astro) and plan for ongoing maintenance.

These guides link to live catalog filters. Entries are comparisons, not ranked or personalized recommendations. This checkout has three catalogs; self-hostable tools are included where listed, not in a separate catalog.

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
