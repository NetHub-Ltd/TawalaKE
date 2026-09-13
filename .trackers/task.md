# Task: Modern Retail OS theme foundation

## Goal
Replace Silk & Slate tokens with DESIGN.md Modern Retail OS and ship a comparison lab so the user can pick one interpretation before product restyle.

## Approved scope
- Rewrite globals.css tokens + @theme from DESIGN.md
- Fonts: Plus Jakarta Sans + Inter
- /themetest laboratory
- **5 DESIGN.md-only variants as tabs** (canonical, register-dense, command-chrome, settlement-focus, ledger-contrast)
- Button radius align
- theme.md + trackers

## Completed
- [x] Token rewrite
- [x] Fonts
- [x] Full lab components
- [x] Five variant tabs (CSS data-theme-variant + tab UI)
- [x] PR #216 opened to dev

## Remaining
- [ ] User selects variant
- [ ] Lock chosen variant as product default (follow-up)
- [ ] CI lint/build green

## Out of scope
- Product screen restyle
- Colors outside DESIGN.md
- Dark as product default

## Design decisions (UX Engineering)
- Variations change **emphasis and rhythm only**, not the palette family
- Fair comparison: same component set on every tab
- Decision helper copy on page for stakeholder choice
