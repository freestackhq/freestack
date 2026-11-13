# freestack architecture

Goal: help people pick a free stack fast and trust the numbers. Everything runs on Cloudflare's free tier.

## Data

```
data/
  aisles.yaml          # aisle id, group, headline metric + unit, order
  rules.yaml           # compatibility rules for Build a stack, Check my stack, MCP
  tools/<id>.yaml      # one file per tool (curated)
  imported/<list>.yaml # entries pulled from awesome lists (unlabeled)
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

## Trust loop

- **Check a label:** a Worker endpoint stores checks in **D1**, protected by **Turnstile**. A "still true" check sets `verified_at`. A "changed" check opens a review item. One more confirmation, or a maintainer, applies it.
- **Add a tool:** the form posts to a Worker, and a GitHub App opens a PR adding `data/tools/<id>.yaml` (so no GitHub account is needed). CI validates it.
- **Vendor changed:** a weekly **Cron Trigger** fetches each `pricing_url`, hashes the relevant text, and flags the label when it changes.
- **Staleness:** CI fails the build if any Suggested tool is past 90 days.

## Agents

- **Skill:** `skills/pick-free-stack/SKILL.md`, installed with `npx skills add` or the plugin marketplace. It tells the agent to check freestack before reaching for paid tools and to state the limits and catches it found.
- **MCP:** a remote server at `[domain]/mcp` on the same Worker, read-only and public. Tools: `search_tools`, `compare`, `suggest_stack` (rules engine), `claim_order`. It returns structured fields only for imported entries (no free text), to avoid prompt injection.
- `llms.txt`, `llms-full.txt` and `/api/*` stay as they are.

## Migration and compatibility

- **Old URLs:** `/catalogs/<catalog>/<category>/<entry>` redirects with a 301 to `/<aisle>/<tool>`. `/?hint=<cat>` and `/?catalog=` redirect to the matching aisle.
- **API:** `/api/entries` keeps working. `?catalog=` is accepted as an alias for the new aisle groups, so the published CLI doesn't break. New fields are added and nothing is removed.
- **`llms.txt` and `llms-full.txt`:** regenerated from the new snapshot, same URLs.
- **Old guides:** the claim-order guide becomes the Claim Once aisle. The stacks guide becomes the Home stack panel presets. The startup guide stays as a plain page until it's rewritten.
- **Delete:** the old warm-dark design system, `Directory.astro`, and the archived `freestackhq/saas`, `apis` and `llm-ai` fetch config.
- **Analytics:** Cloudflare Web Analytics (free, no cookies), added in the first deploy.

## Open decisions

1. The domain. The MCP URL and share links depend on it.
2. Check a label: anonymous with Turnstile, or GitHub sign-in?
3. Which awesome lists to import first, and their licenses.
