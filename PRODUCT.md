# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro with TailwindCSS and Cloudflare Workers. Catalog content is authored in Markdown and compiled into a committed generated snapshot.

## Users

- Startup founders validating an MVP and checking commercial terms, service limits, and upgrade points.
- Students deploying a project and presenting it through a clear demo, repository, and profile.
- Hobbyists choosing between managed services and software they operate themselves.
- Developers and maintainers using the catalog, API, CLI, or LLM text endpoints.

## Product Purpose

Freestack helps people turn a project need into a tool choice without opening many provider pages. It makes limits, eligibility, commercial permissions, and alternatives visible before a user commits. Its motivation is to reduce avoidable cost, policy, and migration surprises while helping people ship work they can share or operate.

## Positioning

Freestack is a decision catalog. Its useful mechanism is structured comparison with hard numbers and practical “pick this if” guidance.

## Operating Context

Users arrive from search, links, AI tools, or developer communities. They have a concrete project in mind and want a short path from need to viable option.

## Capabilities and Constraints

The site has three catalogs, generated content, search, category and field filters, detail pages, audience guides, a JSON API, OpenAPI documentation, `llms.txt`, and a CLI. Self-hostable tools appear in catalog content where listed; this release does not include a dedicated self-hosted catalog. Catalog entries must remain reviewable and usable offline during builds.

## Evidence on Hand

The generated snapshot contains 223 entries across 28 categories: SaaS (187), APIs (18), and LLM & AI (18). The project is deployed to Cloudflare Workers. No user interview notes or product analytics were found in the repository review.

## Product Principles

- Put the decision before the directory.
- Show hard constraints early.
- Explain who should choose each option.
- Preserve source freshness and uncertainty.
- Turn useful results into shareable artifacts.

## Current Release Boundary

The homepage offers three audience paths and six category starting points. The paths guide visitors to student portfolio, founder MVP, or hobbyist self-hosting content and working catalog filters. Search and filters are URL-backed, and visitors can copy a result link. Results are filtered catalog entries, not ranked recommendations. Ranking explanations, saved comparisons, provider-click analytics, and correction submissions remain future work.
