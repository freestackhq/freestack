# Handing freestack to Claude Code

The design is finished on the canvas. This is how to turn it into the site.

## What's in the repo

| File | What it's for |
|---|---|
| `CLAUDE.md` | Rules every session reads first |
| `DESIGN.md` | Tokens, type, the label, label states, navigation, copy rules |
| `ARCHITECTURE.md` | Data layout, rules engine, trust loop, agents, migration |
| `docs/SCREENS.md` | Every route, its boards, and the states and edge cases it must handle |
| `docs/issues/README.md` | The issues, by phase |
| `scripts/file-issues.py` | Files those issues on GitHub |
| `schema/tool.schema.json`, `data/` | Tool schema, example tool, aisles, rules |
| `public/brand/` | Logo mark and favicon |
| `design/fresh/` | The boards. **You add these (step 1).** |

## 1. Put the boards in the repo

Download the canvas files and copy everything under `project/fresh/` into `design/fresh/`. There are 28 boards, and `docs/SCREENS.md` names every one.

Take all of them from one download. Older copies on disk are out of date (line heights, label strips, links).

## 2. Make the open decisions

Claude Code should ask in the PR rather than guess, but these block whole phases:

1. **The domain.** Redirects, share links and the MCP URL need it (phases 0.5 and 6).
2. **The metrics marked "decide" in `data/aisles.yaml`.** Hosting, Email and Inference (phase 0.3).
3. **Check a label sign-in.** Anonymous with Turnstile or GitHub sign-in (phase 4.1).
4. **Which awesome lists to import, and their licenses** (the unlabeled bin).

## 3. File the issues

```
python3 scripts/file-issues.py --dry-run   # check the list
python3 scripts/file-issues.py
```

It's safe to run again: issues that already exist are skipped.

## 4. Run the sessions

Go phase by phase. Within a phase, give each **parallel** issue its own worktree and session:

```
git worktree add ../fs-2.1 -b feat/aisle-page
cd ../fs-2.1 && claude
```

Start each session with:

```
Implement #<N>. Read CLAUDE.md, DESIGN.md and the issue's section in docs/SCREENS.md.
Boards: design/fresh/<Board>.dc.html (and the phone board if listed).
State your assumptions in a short list first. Then write the failing Playwright
and Vitest tests, one per state and edge case. Then build from src/components/.
Check it at 1440px and 390px. Open a PR with "Closes #<N>" and screenshots next
to the boards.
```

Phases 0 and 1 come first, because every page uses the data and the label. After phase 1, the four main pages in phase 2 can run at the same time.

## 5. Review each PR

- Does it match the board's structure and copy, without pasting the board's inline styles?
- Does every number come from the data? A missing number shows "?", never a guess.
- Is every state and edge case in `docs/SCREENS.md` tested?
- Does it work at 390px without sideways scroll, with 44px targets and visible focus?
- Are the boards' sample numbers kept out of the code?
