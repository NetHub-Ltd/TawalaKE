# Tawala Design System — Modern Retail Operating System

Tokens live in `src/app/globals.css` (Tailwind v4 `@theme` + CSS variables).

## Brand
- **Primary:** Deep petrol teal `#003F4E` / `#002832` — command, nav, primary actions
- **Secondary:** Terracotta `#C1705B` / `#924A37` — void, urgency, attention counters
- **Success:** Forest mint `#0F766E` — settle, matched M-Pesa, zero discrepancy
- **Surfaces:** Warm alabaster `#FAF9F9`, register `#F4F3F0`, cards pure white
- **Fonts:** Plus Jakarta Sans (headlines) + Inter (body) + tabular figures for money

## Lab
`/themetest` — full component laboratory (theme toggle, forms, table, toasts, loaders, POS sticky bar).

## Rules
- Border-first cards; restrained teal-tinted shadows only on hover/modals
- Primary hit targets ≥ 48px
- Money columns use `.amount` / `.tabular` (`tnum`)
- Light is product default; `html.dark` for lab/optional dark
