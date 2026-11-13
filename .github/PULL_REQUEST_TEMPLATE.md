## Summary
-

Closes #

## Test plan
- [ ] `pnpm test` and `pnpm typecheck` pass (the pre-push hook runs both)
- [ ] Page changes: matching Playwright spec added or updated, checked at 1440px and 390px next to the board
- [ ] Data changes: `pnpm catalog:generate` run and `src/data/catalog.generated.json` committed
- [ ] No number on screen that isn't in `data/` (unknown shows "?")
- [ ] Preview link (the Preview workflow comments it) looks right
