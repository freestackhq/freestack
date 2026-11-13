# freestack

Directory of free developer tools, student unlocks, free public APIs, and AI models — with hard limits, eligibility, and commercial permissions. Numbers first.

* **Domain**: set by `SITE_URL` (see [`.env.example`](.env.example)); nothing in the code names it
* **Coverage**: 205 labeled tools in 31 aisles, plus 120 unlabeled entries from 7 awesome lists
* **GEO & AI**: `/llms.txt`, `/llms-full.txt`, a read-only MCP server at `/mcp`, and the `pick-free-stack` skill
* **Stack**: Astro 7, Cloudflare Workers runtime

---

## Quickstart

```bash
pnpm install
pnpm dev              # local workerd runtime
pnpm test             # run unit test suite (Vitest)
pnpm build            # build static assets + server bundle
SITE_URL=https://your.domain pnpm deploy:cf   # build and deploy on that custom domain
```

Before the first deploy: set `SITE_URL`, run `pnpm plugin:build` so the Claude Code plugin points at it, and in the GitHub repo create the `label-check` and `add-tool` labels and allow GitHub Actions to create pull requests (the trust loop needs both; see `ARCHITECTURE.md`).

---

## Development

Node 22.18 or newer (`.nvmrc`): the scripts import `.ts` files directly.

```bash
pnpm typecheck        # astro check (.astro and .ts)
pnpm format           # prettier --write (format:check in CI)
pnpm lint:workflows   # actionlint, when installed
pnpm test:e2e         # Playwright (PORT=4441 to run beside another worktree)
```

`pnpm install` installs git hooks with [lefthook](https://lefthook.dev) (`lefthook.yml`):

- **pre-commit**, on staged files only: Prettier (fixes are restaged); `catalog:generate` when `data/`, `schema/`, `label.ts` or `generate.mjs` change (fails if the snapshot changed but isn't staged); the schema test when `data/tools/` or `schema/` change; actionlint on workflows; no `.env` files or tokens.
- **commit-msg**: conventional commit subject (`fix(scope): ...`).
- **pre-push**: `pnpm typecheck` and `pnpm test`.

In an emergency, skip them once with `LEFTHOOK=0 git commit ...` (or `git push`). CI runs the same checks.

The one-time Prettier commit is listed in `.git-blame-ignore-revs`; run `git config blame.ignoreRevsFile .git-blame-ignore-revs` once to skip it in `git blame`.

---

## Catalogs & Content

Data lives in [`data/`](data/): one YAML file per tool in [`data/tools/`](data/tools/) (validated by [`schema/tool.schema.json`](schema/tool.schema.json)), aisles and their headline metric in [`data/aisles.yaml`](data/aisles.yaml), stack rules in [`data/rules.yaml`](data/rules.yaml), unlabeled entries from awesome lists in [`data/imported/`](data/imported/), and trust-loop state in [`data/state/`](data/state/). The old Markdown catalogs were migrated once; see [`docs/migration-report.md`](docs/migration-report.md).

### Adding or Updating Tools

1. Edit or add `data/tools/<id>.yaml` (or use the site's "Add a tool" form). Numbers are the vendor's own figures; unknown is `null` with a `metric_note`.
2. Run `pnpm catalog:generate` to rebuild the committed snapshot, then `pnpm test`.

---

## API & AI Endpoints

Base URL: your `SITE_URL` (CORS open).

| Endpoint | Method | Purpose |
|---|---|---|
| `/llms.txt` | `GET` | Standard LLM navigation and catalog manifest |
| `/llms-full.txt` | `GET` | Every label in plain text, for AI ingestion |
| `/api/health` | `GET` | Service status, version, and catalog counts |
| `/api/catalogs` | `GET` | Catalog metadata, categories, and entry counts |
| `/api/entries` | `GET, POST` | Filter and search tools (`aisle`, `group`, `q`, fields, `limit`; old `catalog`/`category` ids still work) |
| `/api/tools`, `/api/tools/<id>`, `/api/claim` | `GET` | Flat tool list, one tool, and a claim plan (used by the CLI) |
| `/api/openapi.json` | `GET` | OpenAPI 3.1.0 specification |
| `/mcp` | `POST` | Remote MCP server (read-only): `search_tools`, `compare`, `suggest_stack`, `claim_order` |
| `/docs` | `GET` | Interactive Scalar API documentation |

---

## Architecture & Data Pipeline

`data/` is compiled into a committed snapshot ([`src/data/catalog.generated.json`](src/data/catalog.generated.json)) so builds and tests run offline. Tests use their own data in `tests/fixtures/data` (`FREESTACK_DATA`), which never overwrites the snapshot.

```bash
pnpm catalog:generate   # data/ -> src/data/catalog.generated.json (fails on bad data)
```

---

## CLI

Package: [`packages/cli`](packages/cli) → `@kuyacarlo/freestack`. Point it at your deploy with `FREESTACK_API=<SITE_URL>`.

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
