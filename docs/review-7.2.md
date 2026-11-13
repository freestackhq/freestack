# Screenshot review (issue 7.2)

Every route and state in `docs/SCREENS.md`, shot at 1440px and 390px from both builds, side by side with its board.

- **Fixture build** (`tests/fixtures/data`): every label state, like the boards.
- **Real build** (`data/`): 31 aisles, 325 tools (205 labeled, 120 imported).
- **Boards**: `design/fresh/*.dc.html`, desktop boards at 1440, phone boards at 390. Pages that reflow show their desktop board.

Board numbers are samples. Nothing from them went into code.

## Regenerate

- `pnpm review:shots` builds both sites, serves them with `wrangler dev` on `REVIEW_PORT` (default 4431) and `REVIEW_PORT+1`, shoots everything, and writes `review/index.html`.
- `pnpm review:shots --no-build` reuses `dist/` and `dist-real/`.
- `pnpm review:shots --only=compare` shoots captures whose id contains `compare` (boards skipped).
- Output is gitignored: `review/shots/{fixture,real,boards}/*.png`, `review/results.json` (HTTP status and side scroll per shot), `review/index.html`.
- The capture list lives in `scripts/review/captures.mjs`. `scripts/review/board-shim.js` stands in for the boards' missing `support.js` runtime (renders `sc-for`, `sc-if` and `{{…}}`).

## Results

Legend: **matches** = structure and copy match the board; **fixed** = changed in this branch; **known** = difference left for a decision.

### Main pages

| Route / state | Board | Result |
|---|---|---|
| Home `/` | Home, PhoneHome | Matches. Fixed: real stack rows said "100k requests a day, 100k requests a day" and "50k monthly users users a month" (see Label). Known: Claim Once group header is navy; the board paints it yellow, but DESIGN.md keeps Promo for Suggested and one main action. Known: real presets are all "Not checked yet", so every Home row shows its state box. That is the data (presets should be checked tools), not the page. |
| Home, no valid preset `/?as=startup` | Home | Matches. The aisle-list fallback holds 14 real Build aisles in two columns. |
| Copy this stack dialog | CopyStack | Matches. Fixed: the three tabs wrapped onto two rows at 390px. |
| Aisle `/databases` | Aisle, Phone | Matches. Fixed: "No limit" drew a full 5-step scale (read as Biggest) and "Your own disk" overflowed its column; it is now the board's small word with no steps. Fixed: labels with no other limits now say "No other ceilings listed" like the board. Known: the board's "Never sleeps" filter has no data field yet. Known: the check line's pips wrap to 2-3 rows on aisles with 13+ labels (by design: `max-width: 120px`). |
| Aisle with most tools `/inference` | Aisle, Phone | Fixed: unlabeled bin rows on phones wrapped three different ways with long real names and hosts; they now stack the same way every row. |
| Aisle, compare tray, cross-aisle, no matches, could not load | States, Phone | Matches. |
| Aisle, phone filter sheet | PhoneSheet | Matches. Known: no "Never sleeps" switch (no data). |
| Tool `/databases/neon/` | Tool, PhoneTool | Matches. |
| Tool, long name `/embeddings/workers-ai-embeddings/` | PhoneTool | Fixed: at 390px the name broke mid-word beside the scale ("Cloudflar/e"). Long names step down in size. |
| Tool, metric not listed `/team/loom-screen-studio-lite-paths/` | PhoneTool | Matches. Known (data): this tool's "Use it if" is a long paragraph from the import. |
| Tool from an awesome list | Edges | Matches. |
| Compare (2, 3, 4 tools) | Compare, PhoneCompare | Matches. Known: "differs" rows are shaded gray (`--fill`); the board shades them light yellow, which DESIGN.md reserves for Promo. Known: no "Comes with" row (no data field); a "Checked" row is added. |
| Compare, one tool / a tool gone / two aisles | States, Edges | Matches. In real data Fauna is an imported tool, so `ids=neon,fauna,turso` shows it as "?" instead of "left out". |
| Build a stack (parts, empty, problems, D1 without Workers) | Builder, PhoneBuilder | Matches. Fixed: the repeated first limit (above). |
| Search: results, empty, many results, no results, did you mean | Search, PhoneSearch, Edges | Matches. Fixed: "100 transfer GB a month" now reads "100 GB transfer a month". |
| Aisles menu | AislesMenu, PhoneMenu | Fixed: desktop footer now matches the board (ink rule, bold question, outline buttons). Fixed: the desktop menu scrolls inside on short screens (14 real Build aisles). Fixed: the phone menu now ends with "Add a tool"; the phone header had no way to it. |

### Side and supplemental pages

| Route / state | Board | Result |
|---|---|---|
| Check my stack (with unknown tool, empty) | CheckStack | Matches. |
| Catch page `/catches/can-i-sell-on-vercel-hobby/` | Trap | Matches. |
| Claim Once `/student-programs` | Programs | Fixed: on phones the Claim first tag covered "GitHub Student Developer Pack". |
| For coding agents `/agents` | Agents | Matches. Known (env): the MCP URL shows `http://localhost:4321/mcp` when `SITE_URL` is unset at build; a deploy sets it. |
| Check a label `/databases/neon/check` | Verify, PhoneVerify | Matches. |
| Add a tool `/add` | AddTool | Matches. |
| Add a tool: sent | AddToolSent | Matches SCREENS.md ("One step left." then Send on GitHub). Known: the board still says "Sent. Thanks." from before the GitHub-issue flow. |
| Label states `/dev/states/` | States | Fixed: in 4-across cells "0.5 GB" and "No limit" wrapped onto two lines; the number now shrinks in narrow cells. Fixed: "A change is waiting for review" now links "See it" to its GitHub issue, as the boards and SCREENS.md say. |

### Misc

| Route / state | Board | Result |
|---|---|---|
| Not found | NotFound | Matches. Known: the board's heading is "Most visited aisles"; the page says "Aisles to start with" because there is no visit data. |
| Site error `/dev/throw` | Edges, Site error | Matches. Known: the board adds "Labels you opened before still work offline."; there is no service worker, so the page does not promise it. |
| Footer (every page) | | Fixed: on phones the links wrapped with a dangling "/"; separators are hidden at 390px. |

### Label (every page)

- Fixed: aisle units built from real `aisles.yaml` read "100 transfer GB a month" and "50k monthly users users a month". `metricParts()` keeps the size unit with the number and drops a repeated noun.
- Fixed: a metric note that is also the first limit is said once.

Last run: 41 captures, 162 site shots plus 28 boards. No shot scrolls sideways at 390px on either build (`review/results.json`, `overflow`).

## Needs a decision

1. Differs-row shading in Compare and the Claim Once group header: board yellow vs DESIGN.md "Promo only for Suggested and one main action".
2. "Never sleeps" filter and "Comes with" compare row: need data fields before they can show.
3. Real Home presets are unchecked tools, while SCREENS.md says only checked tools can be presets.
