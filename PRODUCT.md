# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro with TailwindCSS and Cloudflare Workers. Catalog content is authored in Markdown and compiled into a committed generated snapshot.

## Users

Developers, students, and small teams choosing free or low-cost developer tools, public APIs, AI models, and self-hosted software.

## Product Purpose

Freestack helps people choose tools without opening many provider pages. It makes limits, eligibility, commercial permissions, and alternatives visible before a user commits to a tool.

## Positioning

Freestack is a decision catalog. Its useful mechanism is structured comparison with hard numbers and practical “pick this if” guidance.

## Operating Context

Users arrive from search, links, AI tools, or developer communities. They have a concrete project in mind and want a short path from need to viable option.

## Capabilities and Constraints

The site has three catalogs, generated content, search, category and field filters, detail pages, guides, a JSON API, OpenAPI documentation, `llms.txt`, and a CLI. Catalog entries must remain reviewable and usable offline during builds.

## Evidence on Hand

The generated snapshot contains 223 entries across 28 categories: SaaS (187), APIs (18), and LLM & AI (18). The project is deployed to Cloudflare Workers. No user interview notes or product analytics were found in the repository review.

## Product Principles

- Put the decision before the directory.
- Show hard constraints early.
- Explain who should choose each option.
- Preserve source freshness and uncertainty.
- Turn useful results into shareable artifacts.

## Current Release Boundary

The homepage offers six category starting points, URL-backed search and filters, and a copyable result link. Results are filtered catalog entries, not ranked recommendations. Ranking explanations, saved comparisons, provider-click analytics, and correction submissions remain future work.
