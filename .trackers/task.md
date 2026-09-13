# Task: Modern Retail OS theme foundation

## Goal
Replace Silk & Slate (indigo SaaS) tokens with DESIGN.md Modern Retail Operating System (petrol teal + terracotta + forest mint) and ship a full theme-test laboratory before product surface restyles.

## Approved scope
- Rewrite `frontend/src/app/globals.css` tokens + `@theme` mapping
- Fonts: Plus Jakarta Sans + Inter (+ mono retained)
- Expand `/themetest` to full lab (toggle, type, buttons, forms, table, chips, toasts, loaders, modal, POS sticky)
- Align Button radii to 0.5rem / 1rem scale
- Update `frontend/theme.md`
- Tracker sync

## Out of scope
- Restyling org shell, POS, customers, checkout, marketing pages
- Button API changes beyond token consumption / radius
- Dark as product default
- Backend / API

## Design decisions
- Light-first institutional chrome
- Border-first elevation for terminal performance
- Tabular figures mandatory for money
- 48px primary hit targets
- Terracotta = attention/void; mint = settlement only

## Verification
- [ ] npm run lint
- [ ] npm run build
- [ ] Manual /themetest light + dark toggle

## Follow-ups (not authorized)
- Product screen restyle PRs consuming new tokens
- Issue #108 subscription_tier_enum triage
- Restore remote `dev` branch convention
