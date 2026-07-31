# freestack.

Directory of **free developer tools and student unlocks** — with limits, eligibility, and commercial notes.

Not a landing page full of vibes. Numbers first.

## Stack

- [Astro](https://astro.build) + [Tailwind CSS v4](https://tailwindcss.com)
- Design system (in-repo): [`src/design-system/`](src/design-system/) — see its README
- Data: [`src/data/tools.ts`](src/data/tools.ts)

## Develop

```bash
pnpm install
pnpm dev
```

```bash
pnpm build
pnpm preview
```

## Add a tool

Append an object to `tools` in `src/data/tools.ts`:

```ts
{
  id: "unique-slug",
  name: "Tool Name",
  blurb: "One line on why it matters.",
  category: "databases", // see CATEGORIES
  cost: "free",          // free | credits | student_free | discount
  student: "no",         // no | required | helps
  commercial: "yes",     // yes | hobby | edu | check
  limits: "0.5 GB · scale-to-zero 5m",
  url: "https://example.com",
  tags: ["optional"],
}
```

Keep blurbs blunt. Always include a real limit string.

## API

Public JSON (CORS open). Base: `https://freestack.kuyacarlo.dev`

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Service ping + endpoint list |
| `GET\|POST /api/claim` | Ordered claim/setup plan from profile flags |
| `GET /api/tools` | Filter/search catalog (`category`, `cost`, `commercial`, `student`, `q`, `limit`) |
| `GET /api/tools/:id` | Single tool |
| `GET /api/openapi.json` | OpenAPI 3.1 spec |
| [`/docs`](https://freestack.kuyacarlo.dev/docs) | Interactive docs (Scalar) |

Claim query/body flags: `student`, `commercial`, `ph`, `ai` (`1`/`true`/`yes`; AI defaults on).

```bash
curl -s 'https://freestack.kuyacarlo.dev/api/claim?student=1&commercial=1' | jq .stackHint
curl -s 'https://freestack.kuyacarlo.dev/api/tools?category=ai&commercial=yes&limit=5'
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

Marp workshop decks live in [`talks/`](talks/) (SaaS free-tier stack + student programs matrix). Catalog data still lives in `src/data/tools.ts`.

## Sibling list

Markdown mirror (awesome.re style): [`kuyacarlo/awesome-freestack`](https://github.com/kuyacarlo/awesome-freestack). Site `tools.ts` is source of truth for the directory UI.

```bash
pnpm sync:awesome   # writes ../awesome-freestack/README.md
```

Live site: [freestack.kuyacarlo.dev](https://freestack.kuyacarlo.dev)

## Workflow

PRs against `master` for catalog/UI changes. Don't push straight to `master` for feature work.

## Notes

- Offers rotate. Re-check vendor pages before you bet a launch on $0.
- Edu licenses are usually non-commercial.
- Not affiliated with any vendor.

## License

Site and CLI code: [MIT](LICENSE). Catalog content is public reference; the markdown mirror [`awesome-freestack`](https://github.com/kuyacarlo/awesome-freestack) is CC0.
