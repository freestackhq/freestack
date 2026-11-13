# Screens

Every screen, where it lives, which board to match, and the states it must handle. Boards are in `design/fresh/`. The numbers on boards are sample data: real numbers always come from `catalog.generated.json`.

The canvas is laid out the same way as this file: main pages, side pages and sections, supplemental pages, misc pages. Phone boards sit to the right of the desktop boards.

## Main pages

| Screen | Route | Desktop board | Phone board |
|---|---|---|---|
| Home | `/` | `Home.dc.html` | `PhoneHome.dc.html` |
| Aisle | `/<aisle>` (e.g. `/databases`) | `Aisle.dc.html` | `Phone.dc.html`, `PhoneSheet.dc.html` (filters) |
| Tool | `/<aisle>/<tool>` | `Tool.dc.html` | `PhoneTool.dc.html` |
| Compare | `/compare?ids=neon,turso` | `Compare.dc.html` | `PhoneCompare.dc.html` |
| Build a stack | `/build?as=indie&hosting=cf-workers&...` | `Builder.dc.html` | `PhoneBuilder.dc.html` |
| Search | overlay on every page: Ctrl K, ⌘K, `/` | `Search.dc.html` | `PhoneSearch.dc.html` |
| Aisles menu | header "Aisles" button | `AislesMenu.dc.html` | `PhoneMenu.dc.html` |

### Home
- Situation picker: Student with school email, Student, Indie builder, Startup. Default: Student. Choice goes in the URL (`?as=`).
- Stack panel: one row per part with limits, catch, can sell, card. Total `$0.00`. "Copy this stack" opens the Copy dialog. "Swap parts in Build a stack" opens `/build` with the same picks.
- Presets come from data, not from the page. Only checked tools can be presets.
- States: a preset tool goes overdue (show it, drop it from presets at the next build). Situation has no valid preset (show the aisle list instead of an empty panel).

### Aisle
- Headline metric from `aisles.yaml`. Labels sorted: Suggested, then checked, then the rest, by metric.
- Filters live in the URL. Compare tray: starts empty, max 4, Clear, a message at the cap.
- The check line above the grid: "N of M checked against the vendor's page." with a "Check one" link.
- Unlabeled bin: imported entries, search-only, "Write its label".
- States: no matches (offer to drop one filter, with the count it would give), could not load, loading, compare across aisles. See `States.dc.html`.

### Tool
- One panel: Use it if, Skip it if (each reason links to the tool to use instead), The catch, Fits.
- Check row: not checked / checked / overdue / vendor changed / change waiting for review.
- States: imported tool with no label (`Edges.dc.html`, "Tool from an awesome list"). Tool removed from the catalog: 301 to its aisle.

### Compare
- 2 to 4 columns. ✕ per column, a dashed "Add a tool" column, a menu per column to swap. Rows that differ are shaded and say "Differs".
- States: only one tool in the URL (show "Pick one more to compare"). A tool in the URL no longer exists (drop it, say so). Tools from two aisles (the cross-aisle message in `States.dc.html`).

### Build a stack
- Parts list. Live checks from `rules.yaml` through `src/lib/rules.ts`. Banner: problems first, then "to watch".
- States: no parts yet, all parts fine ("Works. No problems found"), a part removed, a rule that needs a missing part (D1 without Workers).

### Search
- Groups: catches, tools, aisles. Arrow keys, Enter, Esc.
- States: no results (with "Did you mean" and "Add it"), one group empty (hide the group header).

## Side pages and sections

| Screen | Route | Board |
|---|---|---|
| Check my stack | `/check` | `CheckStack.dc.html` |
| Catch page | `/catches/<slug>` | `Trap.dc.html` |
| Claim Once aisle | `/student-programs` (and other Claim Once aisles) | `Programs.dc.html` |
| For coding agents | `/agents` | `Agents.dc.html` |
| Copy this stack | dialog from Home and Build a stack | `CopyStack.dc.html` |

- Check my stack: same engine as Build a stack. Unknown tool: keep the chip dashed, check the rest, offer "Add it" (`Edges.dc.html`).
- Catch pages: one per question, generated from `catches` and `skip_if`. Answer first, then free tools that avoid the catch.
- Copy dialog: "Link copied" toast (`Edges.dc.html`).

## Supplemental pages

| Screen | Route | Desktop board | Phone board |
|---|---|---|---|
| Check a label | `/<aisle>/<tool>/check` | `Verify.dc.html` | `PhoneVerify.dc.html` |
| Add a tool | `/add` | `AddTool.dc.html` | reflows from desktop |
| Add a tool: sent | `/add/sent` | `AddToolSent.dc.html` | reflows from desktop |
| Label and page states | component reference | `States.dc.html` | |

- Check a label: Still true / Changed per line. All "Still true": label shows "Checked today". Any "Changed": label shows "A change is waiting for review" until a maintainer applies it. Failed send or Turnstile failure: keep answers, offer "Try sending again".
- Add a tool: tool already listed (link to its label), a number that isn't a number (ask for the vendor's figure or "Not listed"). After sending: `AddToolSent`, with the pending label preview and a link to the PR.

## Misc pages

| Screen | Route | Board |
|---|---|---|
| Not found | any unknown route | `NotFound.dc.html` |
| Edge cases | reference sheet | `Edges.dc.html` |
| Brand | reference sheet | `Brand.dc.html` |

- Site error (Worker or build failure): `Edges.dc.html`, "Site error".
- Old URLs redirect with 301 (see `ARCHITECTURE.md`), so the 404 only shows for real typos.

## Label states (all screens)

| State | Strip | Links to |
|---|---|---|
| Checked within 90 days | Navy, yellow check, "Checked 3 days ago by Karlo". Only this state can be Suggested. | |
| Not checked yet | Plain white, muted "Not checked yet", "Check it" link | Check a label |
| Overdue (over 90 days) | Orange, "Checked 24 Jul. Due for a recheck", "Recheck it" | Check a label |
| Change waiting for review | Light gray, wrench, "A change is waiting for review" | the review item |
| Vendor page changed | Navy, yellow wrench, "Neon changed its pricing page on 12 Nov", "Recheck this label" | Check a label |
| From an awesome list | Gray "?", "From free-for-dev. No numbers yet", "Write its label" | Add a tool, prefilled |

## Shared rules for every screen

- Header: wordmark, centered search trigger with the Ctrl K hint, "Aisles" menu, "Add a tool". Footer: Check my stack, For coding agents, Source on GitHub.
- Every view that has choices puts them in the URL, so it can be shared.
- Phone: 390px wide, never scrolls sideways, 44px touch targets.
