# Issue drafts

`scripts/file-issues.py` files every `###` heading below as a GitHub issue, with its phase as a label. Phases run in order. Inside a phase, issues marked **parallel** can run in separate worktrees at the same time.

Every page issue is done when:
- it matches its boards in `design/fresh/` (structure and copy, built from `src/components/`),
- every state and edge case listed for it in `docs/SCREENS.md` has a Playwright test,
- it works at 390px with no sideways scroll,
- the PR has a screenshot next to the board.

## Phase 0: Data

### 0.1 Tool schema and validation
- Validate `data/tools/*.yaml` against `schema/tool.schema.json` in `pnpm test` and CI.
- Done when: a bad file fails the test, and `data/tools/neon.yaml` passes.

### 0.2 Migrate catalogs to one YAML file per tool
- Script: current catalog to `data/tools/<id>.yaml`. Keep every existing number. Unknown fields become `unknown`, never a guess.
- Merge the `llm-ai` catalog into the AI aisles and dedupe.
- Done when: tool count matches (minus duplicates) and the PR attaches a diff report showing nothing was lost.

### 0.3 Aisles and headline metrics
- `data/aisles.yaml` (draft in the repo). Resolve the three marked "decide" before merging.
- Done when: every tool's `metric` matches its aisle's unit, or is `null` with a `metric_note`.

### 0.4 Generator: scale steps, label state, Suggested
- Compute the 5-step scale (`ceil(value / aisle_max * 5)`), the label state (not checked, checked, overdue, change waiting for review, vendor changed, imported) and Suggested (checked within 90 days only).
- Done when: unit tests cover every state, "?" and "No limit".

### 0.5 Old URL redirects and API compatibility
- 301s from `/catalogs/...`, `/?hint=` and `/?catalog=`. `/api/entries?catalog=` keeps working. `llms.txt` regenerated.
- Done when: a test hits every old URL pattern and gets the right 301, and the published CLI still runs.

## Phase 1: Components

### 1.1 Tokens and fonts **parallel**
- Palette and Archivo (three widths) from `DESIGN.md`. Line height 1 or more on condensed type. Delete the old warm-dark tokens.

### 1.2 Label component **parallel**
- `Label.astro`: all six strips, the 5-step scale, bottom line, catch line, compare toggle, Suggested tag.
- Done when: a test page renders every state and matches `States.dc.html`.

### 1.3 Header, footer, Aisles menu **parallel**
- Boards: `AislesMenu.dc.html`, `PhoneMenu.dc.html`. Menu opens on click and Enter, closes on Esc and outside click, traps focus on phone.

### 1.4 Search panel **parallel**
- Boards: `Search.dc.html`, `PhoneSearch.dc.html`. Pagefind index of tools, catches and aisles. Ctrl K, ⌘K, `/`.
- Edge cases: no results with "Did you mean" and "Add it" (`Edges.dc.html`).

## Phase 2: Main pages

### 2.1 Aisle page **parallel**
- Boards: `Aisle.dc.html`, `Phone.dc.html`, `PhoneSheet.dc.html`. Filters and tray in the URL.
- Edge cases: no matches, could not load, loading, compare across aisles, unlabeled bin.

### 2.2 Tool page **parallel**
- Boards: `Tool.dc.html`, `PhoneTool.dc.html`.
- Edge cases: every check-row state, imported tool with no label, removed tool (301 to its aisle).

### 2.3 Compare **parallel**
- Boards: `Compare.dc.html`, `PhoneCompare.dc.html`. Reads `?ids=`.
- Edge cases: one tool, unknown id in the URL, tools from two aisles.

### 2.4 Home and the stack panel **parallel**
- Boards: `Home.dc.html`, `PhoneHome.dc.html`, `CopyStack.dc.html`. Situation in the URL. Presets from data, checked tools only.
- Edge cases: "Link copied", a preset tool goes overdue.

## Phase 3: Build a stack

### 3.1 Rules engine
- `src/lib/rules.ts` reading `data/rules.yaml`. One engine for Build a stack, Check my stack and MCP `suggest_stack`.
- Done when: unit tests cover every rule in `rules.yaml`, plus "no parts" and "all fine".

### 3.2 Build a stack page
- Boards: `Builder.dc.html`, `PhoneBuilder.dc.html`. Picks in the URL. "Already have a stack? Check it" links to `/check`.

### 3.3 Check my stack page
- Board: `CheckStack.dc.html`. Edge case: a tool we don't list stays as a dashed chip, the rest still get checked.

## Phase 4: Trust loop

### 4.1 Check a label
- Boards: `Verify.dc.html`, `PhoneVerify.dc.html`. GitHub issue form `label-check.yml` plus the `label-check` workflow (no Worker, D1 or Turnstile).
- All "Still true" sets `verified_at` and `verified_by`. Any "Changed" adds a `data/state/reviews.yaml` entry and opens a PR; the label shows "A change is waiting for review".
- Edge cases: a link too long for GitHub shows the body to copy and keeps the answers.

### 4.2 Add a tool
- Boards: `AddTool.dc.html`, `AddToolSent.dc.html`. GitHub issue form `add-tool.yml` plus the `add-tool` workflow, which opens a PR with `data/tools/<id>.yaml`.
- Edge cases: tool already listed, a number that isn't one, sent state with the issue-form link and the open add-tool PRs.

### 4.3 Weekly pricing-page scan
- Cron Trigger hashes each `pricing_url` and sets "vendor changed".

### 4.4 Staleness gate
- CI fails if any Suggested tool is past 90 days.

## Phase 5: Side pages

### 5.1 Catch pages **parallel**
- Board: `Trap.dc.html`. One static page per catch, generated from `catches` and `skip_if`.

### 5.2 Claim Once aisles **parallel**
- Board: `Programs.dc.html`. Big number is how long it lasts. "I have" filter.

### 5.3 For coding agents page **parallel**
- Board: `Agents.dc.html`.

### 5.4 Not found and site error **parallel**
- Boards: `NotFound.dc.html`, `Edges.dc.html` ("Site error").

## Phase 6: Agents

### 6.1 `pick-free-stack` skill
### 6.2 Remote MCP server: `search_tools`, `compare`, `suggest_stack`, `claim_order`
- Structured fields only for imported entries.

## Phase 7: Launch

### 7.1 Accessibility pass
- Focus visible everywhere, 44px targets, a sentence for every icon, "Differs" in text.
### 7.2 Screenshot review
- Playwright screenshots of every page at 1440px and 390px, next to their boards, in one PR.
### 7.3 Deploy and analytics
- Cloudflare Workers deploy, Cloudflare Web Analytics.
