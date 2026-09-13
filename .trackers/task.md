# Task: Modern Retail OS theme foundation

## Goal
Lock DESIGN.md canonical theme + shared UI kit; lab validates components.

## Completed
- [x] Canonical tokens + fonts (Plus Jakarta + Inter)
- [x] Global surface gradient (warm alabaster + petrol tint)
- [x] User selected **canonical**
- [x] Shared UI kit under `frontend/src/lib/components/ui/`
  - Button, Input, Textarea, Select, Label, Switch, Checkbox
  - Badge, Card, Modal, Spinner, Skeleton
  - Calendar, BarChart, LineChart, Table, SuccessBanner
  - barrel `index.ts`
- [x] `/themetest` rebuilt from shared components + calendar + charts
- [x] PR #216

## Remaining
- [ ] CI lint/build green
- [ ] Product surface restyles (follow-up PRs)

## Design decisions
- Canonical only for product default
- Responsiveness via globals tokens (section-padding, type scale, 48px controls)
- Charts are zero-dep SVG for supply-chain safety
