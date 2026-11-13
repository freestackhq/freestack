# freestack

@~/.config/karlo/AGENTS.md
@DESIGN.md
@ARCHITECTURE.md

## Rules for this repo

- pnpm only. Astro 7 on Cloudflare Workers. Podman, not Docker.
- Data lives in `data/tools/*.yaml`, validated by `schema/tool.schema.json`. Never hand-edit `src/data/catalog.generated.json`. Run `pnpm catalog:generate`.
- Build UI from `src/components/` and the tokens in `DESIGN.md`. Never invent colors, fonts or new label layouts.
- Reference design: `design/fresh/<Screen>.dc.html`. Match its structure and copy. Do not paste its inline styles. The numbers on boards are samples, never data.
- `docs/SCREENS.md` lists every route, its boards, and the states and edge cases to test. A page isn't done until each one has a test.
- Never show a number that isn't in the data. Unknown means "unknown", not a guess.
- Tests first. Unit tests with Vitest. Every page gets a Playwright test before it counts as done.
- One issue, one branch (`feat/`, `fix/`, `chore/`), one PR with `Closes #N`.
- State your assumptions before you build. If an issue is ambiguous, ask in the PR instead of guessing.
