# freestack.

Directory of **free developer tools, student unlocks, and self-hosted software**
— with limits, eligibility, and commercial notes.

Not a landing page full of vibes. Numbers first.

## What this is

This is a **template + generator**, not a hand-maintained site. The site scrapes
Markdown catalog repos under [`github.com/freestackhq`](https://github.com/freestackhq),
parses them into JSON, and auto-generates every page and API endpoint. Add a
repo to `catalogs.config.mjs`, regenerate, done.

| Catalog repo | Contents | Format |
| --- | --- | --- |
| [`freestackhq/free-tools`](https://github.com/freestackhq/free-tools) | Free dev tools + student unlocks | Markdown, one file per category |
| [`freestackhq/selfhosted`](https://github.com/freestackhq/selfhosted) | Self-hosted software comparison | Markdown, one file per category |

### Catalog pipeline

```bash
pnpm catalog:fetch      # git-clone catalog repos into .catalogs/ (gitignored)
pnpm catalog:generate   # parse markdown → src/data/catalog.generated.json (committed)
pnpm catalog:update     # fetch + generate
```

`src/data/catalog.generated.json` is **committed**, so `astro build` and tests
work offline. Regenerate it whenever a catalog repo changes.

The markdown format is shared across catalogs (see the schema in each repo):

- YAML frontmatter: `category`, `description`, `order`
- `## Comparison Matrix` table: quick-scan row per entry
- `## <Entry>` sections: `| Field | Value |` table, prose, `**Pick this if**`, `**vs X**`

### Adding a catalog

1. Create the repo under `freestackhq` in that markdown format (see `free-tools`
   or `selfhosted` as the template).
2. Add an entry to `catalogs.config.mjs` (`id`, `label`, `owner`, `repo`, `branch`, `filters`).
3. `pnpm catalog:update` and rebuild.

## Stack

- [Astro](https://astro.build) + [Tailwind CSS v4](https://tailwindcss.com)
- Deployed to [Cloudflare Workers](https://workers.cloudflare.com) via `@astrojs/cloudflare` (Astro 6+ removed Pages support)
- Design system (in-repo): [`src/design-system/`](src/design-system/) — see its README
- Data: generated snapshot [`src/data/catalog.generated.json`](src/data/catalog.generated.json)

## Develop

```bash
pnpm install
pnpm dev            # workerd runtime locally
```

```bash
pnpm build          # static + worker bundle to dist/
pnpm preview        # local workerd preview of the build
```

## Test

```bash
pnpm test           # Vitest unit tests (parser + data layer)
pnpm test:e2e       # Playwright end-to-end (builds, previews, drives chromium)
```

E2e needs a one-time `pnpm exec playwright install chromium`.

## Deploy

```bash
pnpm deploy:cf      # pnpm build && wrangler deploy
```

First-time setup / domain (`freestack.kuyacarlo.dev`):

1. `pnpm exec wrangler login`
2. Dashboard → Workers & Pages → freestack → Settings → **Domains & Routes** → Add custom domain (the `kuyacarlo.dev` zone lives outside the wrangler OAuth account, so it can't auto-provision)
3. `pnpm dns:freestack` to check resolution

## Add a tool

**Edit the catalog repo, not this site.** Each catalog owns its entries.

- **Free tools:** open a PR against [`freestackhq/free-tools`](https://github.com/freestackhq/free-tools) — add a `## <Tool>` section with `URL`, `Cost`, `Student`, `Commercial`, `Limits` fields. CI validates the schema.
- **Self-hosted:** open a PR against [`freestackhq/selfhosted`](https://github.com/freestackhq/selfhosted) with the standard field table.

Then `pnpm catalog:update` here and rebuild. `scripts/convert-tools.mjs` is
retained as the one-way migrator from the legacy `src/data/tools.ts`; the
source of truth now lives in the catalog repos.

## API

Public JSON (CORS open). Base: `https://freestack.kuyacarlo.dev`

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Service ping + endpoint list |
| `GET\|POST /api/claim` | Ordered claim/setup plan from profile flags |
| `GET /api/catalogs` | List catalogs (labels, categories, entry counts) |
| `GET\|POST /api/entries` | Filter/search entries across catalogs (`catalog`, `category`, `q`, field filters, `limit`) |
| `GET /api/tools` | Legacy free-tools search (kept for the CLI; `category`, `cost`, `commercial`, `student`, `q`, `limit`) |
| `GET /api/tools/:id` | Single legacy free-tool |
| `GET /api/openapi.json` | OpenAPI 3.1 spec |
| [`/docs`](https://freestack.kuyacarlo.dev/docs) | Interactive docs (Scalar) |

Entries API example — field filters map to markdown table columns:

```bash
curl -s 'https://freestack.kuyacarlo.dev/api/entries?catalog=free-tools&cost=free%20forever&commercial=commercial%20ok&q=neon'
curl -s 'https://freestack.kuyacarlo.dev/api/catalogs'
```

Claim query/body flags: `student`, `commercial`, `ph`, `ai` (`1`/`true`/`yes`; AI defaults on).

```bash
curl -s 'https://freestack.kuyacarlo.dev/api/claim?student=1&commercial=1' | jq .stackHint
```

Alternate claim directories (community scholarships, CSR learning, campus clubs): [`/guides/claim-order#alt-paths`](https://freestack.kuyacarlo.dev/guides/claim-order#alt-paths).
## CLI

Package: [`packages/cli`](packages/cli) → `@kuyacarlo/freestack`

```bash
pnpm dlx @kuyacarlo/freestack claim --student --commercial
pnpm dlx @kuyacarlo/freestack tools --category ai --commercial yes
pnpm dlx @kuyacarlo/freestack tool neon
# from this repo:
pnpm cli claim --commercial
```

Override API base with `FREESTACK_API` (default production site). Prefer **pnpm** (`pnpm dlx` / `pnpm cli`) over npm/npx.

## Talks

Marp workshop decks live in [`talks/`](talks/) (SaaS free-tier stack + student programs matrix).

## Sibling list

The legacy free-tools markdown mirror lives at
[`kuyacarlo/awesome-freestack`](https://github.com/kuyacarlo/awesome-freestack)
(awesome.re style, CC0). It's superseded by `freestackhq/free-tools`; the
`pnpm sync:awesome` script is retained for the old mirror. The new source of
truth for the directory UI is the generated snapshot in
`src/data/catalog.generated.json`.

Live site: [freestack.kuyacarlo.dev](https://freestack.kuyacarlo.dev)

## Workflow

PRs against `master` for catalog/UI changes. Don't push straight to `master` for feature work.

## Notes

- Offers rotate. Re-check vendor pages before you bet a launch on $0.
- Edu licenses are usually non-commercial.
- Not affiliated with any vendor.

## License

Site and CLI code: [MIT](LICENSE). Catalog content is public reference; the markdown mirror [`awesome-freestack`](https://github.com/kuyacarlo/awesome-freestack) is CC0.
