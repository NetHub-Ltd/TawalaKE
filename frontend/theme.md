# Tawala Design System — Modern Retail OS (Canonical)

## Source of truth
| Concern | Location |
|---------|----------|
| Tokens, surface, type, radii, shadows | `src/app/globals.css` |
| Fonts | `src/app/layout.tsx` — Plus Jakarta Sans + Inter + mono |
| Components | `src/lib/components/ui` → `import { … } from "@/lib/components/ui"` |
| Lab | `/themetest` |
| Agent rules | Root `AGENTS.md` §5 |

## Rules (non-negotiable in product UI)

### Forbidden
- **Hardcoded colors:** hex, or Tailwind palette chrome (`bg-slate-*`, `text-slate-*`, `bg-emerald-*`, `bg-blue-*`, `bg-indigo-*`, `bg-white` / `bg-black` as surfaces, etc.)
- **Hardcoded fonts / font sizes:** no `text-[11px]`, arbitrary `text-3xl` as display system, or extra `fontFamily` loads in features
- **One-off controls** when the kit has an equivalent (`Button`, `Input`, `Select`, `Switch`, `Modal`, `Badge`, `Spinner`, `Skeleton`, …)

### Required
- Semantic tokens: `bg-background`, `bg-card`, `bg-register`, `text-foreground`, `text-muted`, `border-border`, `bg-brand-primary` / `secondary` / `accent`
- Type roles: `text-h1`…`text-h4`, `amount-lg` / `amount-md`, `tabular` for money
- Button roles: primary = command · secondary = void/destructive · success = pay/settle
- Import kit: `import { Button, Input, Card } from "@/lib/components/ui"`

### Check before PR
```bash
npm run check:theme
npm run lint
npm run build
```

## Lab
`/themetest` exercises the shared kit (forms, calendar, bar/line charts, table, modal, badges).


## Phase F — Public vs app shell

**Decision (2026-09-14):** Public marketing/legal/blog stay under `(public)` and **inherit** the same canonical tokens. They do **not** get a second palette or font stack.

- Allowed: different page structure, longer prose, marketing sections.
- Forbidden: redefining `--brand-*`, `--background`, `--surface`, or loading alternate display fonts in public routes.
- App product UI under `(organization)` and `src/features` remains the strict kit surface (`check:theme` strict paths).
