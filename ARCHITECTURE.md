# freestack architecture

Goal: help people pick a free stack fast and trust the numbers. Everything runs on Cloudflare's free tier.

## Data

```
data/
  aisles.yaml          # aisle id, group, headline metric + unit, order
  rules.yaml           # compatibility rules for Build a stack, Check my stack, MCP
  tools/<id>.yaml      # one file per tool (curated)
  imported/<list>.yaml # entries pulled from awesome lists (unlabeled)
  state/reviews.yaml   # open "Changed" reports: [{ tool, issue, opened }]; written by the label-check workflow
  state/pricing.yaml   # pricing-page scan: { <tool id>: { hash, checked_at, changed_at } }; written by the weekly scan
  state/links.yaml     # link check: { <id>: { url_status, pricing_status, final_url, checked_at, failing_since, dead_since } }; written by the weekly link check
schema/
  tool.schema.json     # CI validates every tools/*.yaml against this
```

- **One YAML file per tool** replaces the Markdown tables. A diff touches one tool, the Add a tool form maps to it one to one, and CI rejects bad data.
- The build compiles everything into `src/data/catalog.generated.json`, which is never hand-edited. The site, API, `llms.txt`, CLI and MCP all read this one snapshot.
- **The headline metric comes from the aisle**, not the tool. `aisles.yaml` says Databases uses `storage_gb`. Every tool in that aisle must set it, or set `null` with a reason ("not listed").
- The scale step is computed at build time: `ceil(value / aisle_max * 5)`.

Tool fields (see `schema/tool.schema.json` and `data/tools/neon.yaml`):
`id, name, kind, url, aisle, metric, limits[], who[], region, sell, card, catches[], use_if[], skip_if[{reason, use}], pricing_url, verified_at, verified_by, source`.

`who` values: `anyone`, `student_any_id`, `student_school_email`, `startup_proof`.
`sell` and `card` values: `yes`, `no`, `unknown`.

## Rules engine

`rules.yaml` holds data-driven checks. One engine (`src/lib/rules.ts`) is used by Build a stack, Check my stack and the MCP `suggest_stack` tool. Examples:

```yaml
- id: no-selling
  when: { situation: [indie, startup], tool.sell: no }
  level: problem
  text: "{tool} does not allow selling, and you are building to sell."
- id: d1-needs-workers
  when: { tool: d1, not_with: { aisle: hosting, tool: cf-workers } }
  level: problem
  text: "Cloudflare D1 only runs inside Cloudflare Workers."
- id: auth-built-in
  when: { tool: supabase, with: { aisle: auth } }
  level: watch
  text: "Supabase already has sign-in built in."
```

## Pages

- Astro 7 with static prerendering for aisles, tools, compare and catch pages. Filters and compare picks live in the URL (`/compare?ids=neon,turso`), so every view is a shareable link.
- Catch pages are generated from `catches` and `skip_if`, one per question people search for ("Can I sell on Vercel Hobby?").
- Search uses **Pagefind**: a static index built at deploy, with no server and no cost.

## Trust loop (decided: GitHub issues, no Worker, D1, Turnstile or GitHub App)

The site holds no secrets and stores nothing. People send checks and new tools as **GitHub issues from the repo's issue forms**, so GitHub is the sign-in, the spam filter and the review queue.

- **Check a label:** the page collects Still true / Changed per line, then "Send on GitHub" opens `.github/ISSUE_TEMPLATE/label-check.yml` prefilled through the URL (`?template=…&title=…&<field id>=…`). The `label-check` workflow parses the submitted form:
  - every line "Still true": it sets `verified_at` (today) and `verified_by` (the GitHub login) in `data/tools/<id>.yaml`, commits, and closes the issue.
  - any line "Changed": it adds `{ tool, issue, opened }` to `data/state/reviews.yaml` (the label shows "A change is waiting for review") and opens a PR that applies the new values and removes that entry, with `Closes #<issue>`. Closing the issue without merging also removes the entry.
- **Add a tool:** same pattern with `add-tool.yml`. The `add-tool` workflow writes `data/tools/<id>.yaml` from the form and opens a PR. CI validates it against the schema.
- **Vendor changed:** a weekly GitHub Actions cron fetches each `pricing_url`, hashes the visible text, and records `changed_at` in `data/state/pricing.yaml` when the hash moves. A recheck that lands after `changed_at` clears the state.
- **Dead links:** a weekly cron (`pnpm ops:link-check`, Thursdays) checks every `url`, `pricing_url` and imported url. 404, 410 and DNS failures are dead; 401, 403, 429 and Cloudflare challenges are unknown, never dead. `dead_since` needs a failure on two runs on different days. The generator drops imported entries with `dead_since` and flags labeled tools with `link_dead` (a person decides what to do; see `docs/link-report.md`).
- **Staleness:** CI fails if any Suggested tool's `verified_at` is past 90 days.
- If the prefilled URL is too long for GitHub, the page shows the issue body to copy and a plain "New issue" link instead.

## Agents

- **Skill:** `skills/pick-free-stack/SKILL.md`, installed with `npx skills add` or the plugin marketplace. It tells the agent to check freestack before reaching for paid tools and to state the limits and catches it found.
- **MCP:** a remote server at `<SITE_URL>/mcp` on the same Worker, read-only and public. Tools: `search_tools`, `compare`, `suggest_stack` (rules engine), `claim_order`. It returns structured fields only for imported entries (no free text), to avoid prompt injection.
  - Hand-written, stateless Streamable HTTP in `src/lib/mcp/` (no SDK): JSON responses, no sessions or SSE. Serves 2026-07-28 per-request metadata and the older `initialize` handshake.
- **Plugin:** `.claude-plugin/marketplace.json` and `plugins/freestack/` hold the real address, so `pnpm plugin:build` regenerates them from `SITE_URL` (`--check` fails on drift). Rerun and commit it whenever `SITE_URL` changes. `/skills/pick-free-stack/SKILL.md` serves the skill with the address filled in at build time.
- `llms.txt`, `llms-full.txt` and `/api/*` stay as they are.

## Migration and compatibility

- **Old URLs:** `/catalogs/<catalog>/<category>/<entry>` redirects with a 301 to `/<aisle>/<tool>`. `/?hint=<cat>` and `/?catalog=` redirect to the matching aisle.
- **API:** `/api/entries` keeps working. `?catalog=` is accepted as an alias for the new aisle groups, so the published CLI doesn't break. New fields are added and nothing is removed.
- **`llms.txt` and `llms-full.txt`:** regenerated from the new snapshot, same URLs.
- **Old guides:** the claim-order guide becomes the Claim Once aisle. The stacks guide becomes the Home stack panel presets. The startup guide stays as a plain page until it's rewritten.
- **Delete:** the old warm-dark design system, `Directory.astro`, and the archived `freestackhq/saas`, `apis` and `llm-ai` fetch config.
- **Analytics:** Cloudflare Web Analytics (free, no cookies), added in the first deploy.

## Configuration

- `SITE_URL`: the public origin. Astro's `site`, share links, `llms.txt`, the API docs, the MCP URL and the Workers custom domain (`pnpm deploy:cf`) all come from it. Read it through `src/lib/site.ts`.
- `PUBLIC_GITHUB_REPO`: `owner/name` for issue forms and source links. Default `freestackhq/freestack`.
- `PUBLIC_CF_ANALYTICS_TOKEN`: Cloudflare Web Analytics beacon. Empty ships no analytics.

## Decisions

1. Domain: an env var (`SITE_URL`), not code.
2. Check a label and Add a tool: GitHub issue forms (sign-in by GitHub), processed by workflows.
3. Awesome lists: every candidate list is checked; only lists whose license allows reuse are imported, with the license recorded in `data/imported/<list>.yaml`.
4. Aisle metrics: each aisle measures what its tools list. Hosting is split into Sites and functions (`bandwidth_gb_month`) and Always-on servers (`ram_gb`); Email uses `emails_per_day`; Inference uses `requests_per_day`.
