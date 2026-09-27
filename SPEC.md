# Freestack decision catalog specification

## Purpose

Help developers choose free or low-cost tools by making limits, eligibility, commercial permissions, and alternatives easy to compare.

## Users and scenarios

- A student or early-career developer starts from a concrete need and checks whether a tool fits their project.
- A small team checks free tier limits and commercial terms before adopting a provider.
- A maintainer or agent reads catalog data through the website, API, CLI, or LLM text endpoints.

## Product contract

1. The homepage gives visitors direct starting points for common developer needs.
2. Search, category selection, and catalog field filters operate on the active catalog.
3. The URL preserves active catalog, search, every selected category, need preset, and commercial filter state so results can be shared.
4. Catalog and detail pages expose source data, hard limits, eligibility, commercial terms, and alternatives when present.
5. Results are filtered catalog entries. The product does not rank or score providers.
6. Catalog data is generated from local Markdown into a committed snapshot. Build and tests must not require fetching external catalogs.
7. The JSON API, OpenAPI document, `llms.txt`, `llms-full.txt`, and CLI remain available alongside the site.

## Homepage starting points

| Need | Catalog | Category |
|---|---|---|
| Host a web app | SaaS | Hosting |
| Store data | SaaS | Databases |
| Add authentication | SaaS | Auth & secrets |
| Send email | SaaS | Email & forms |
| Use a public API | APIs | Weather |
| Run AI | LLM & AI | Inference |

Each starting point narrows the directory. It does not imply a provider recommendation or verified ranking.

## Catalog and API contract

- Catalog identifiers are `saas`, `apis`, and `llm-ai`.
- The current generated snapshot contains 223 entries across 28 categories.
- Entry URLs follow `/catalogs/{catalog}/{category}/{entry}`.
- `/api/entries` supports GET filters and POST JSON filters. `/api/catalogs` describes catalog structure.
- API examples and docs must use catalog identifiers present in the generated snapshot.

## Out of scope for this release

- Provider ranking, numeric fit scores, and explanations for inferred recommendations.
- Accounts, saved comparisons, and server-side personalization.
- Product analytics or claims that an activation event is measured.
- Catalog correction submissions and new freshness data fields.

## Acceptance criteria

- Each homepage starting point opens its intended catalog and category.
- Search, category, and field filters combine and update the visible result count.
- Direct URLs restore supported query state, and copying a result link preserves it.
- All three catalogs remain browsable, including their detail pages.
- Unit tests, browser tests, and the production build pass before the local commit.
- README, PRODUCT.md, DESIGN.md, and redesign notes describe shipped behavior without implying unshipped ranking or analytics.
