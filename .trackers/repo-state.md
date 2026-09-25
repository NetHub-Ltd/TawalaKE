# Repository State

- **Default branch:** `main` (confirm on GitHub)
- **Integration branch:** `dev` (all PRs target `dev`)
- **As of:** 2026-09-26

## Latest merged into `dev` (selected)
- #399 receipt print iframe (self-contained HTML)
- #398 product settings dropdowns + invoice collect credit
- #397 thermal receipt look
- #396 receipt services + header/body/footer
- #395 tax forced to zero (feature gate)
- #394 / #390 terminal service fee + discount parity
- #383 platform org delete analytics FK
- #377–#382 overview + expenses epic

## Open PRs → `dev`
- (none at last check — refresh with `gh pr list --base dev`)

## Active concern
Receipt print must use **data → self-contained HTML → hidden iframe → print()**, not cloning Tailwind DOM into `about:blank`.
