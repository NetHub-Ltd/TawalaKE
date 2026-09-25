# Theme & UX Remediation Milestones

**Program:** Canonical Modern Retail OS rollout  
**Source:** `Tawala_Frontend_Theme_UX_Audit_Report.pdf` + DESIGN.md  
**Branch convention:** topic branches → PR into `dev`  
**Hard rules:** AGENTS.md §5 (no hardcoded colors/fonts/sizes; tokens from `globals.css`; reuse `@/lib/components/ui`)

Status legend: `[x]` done · `[ ]` not started · `[~]` in progress

---

## Phase 0 — Foundation (theme lab + rules)

**Goal:** Lock canonical theme, prove tokens on a lab surface, and stop new visual debt.

| ID | Task | Status | Evidence / notes |
|----|------|--------|------------------|
| 0.1 | Rewrite `globals.css` to DESIGN.md canonical tokens (petrol / terracotta / mint, alabaster, radii, shadows) | [x] | `chore/theme-retail-os` |
| 0.2 | Lock fonts: Plus Jakarta Sans (display) + Inter (body) in root layout | [x] | `layout.tsx` |
| 0.3 | Global surface gradient (warm alabaster + petrol tint) on `body` | [x] | `--surface` + body background |
| 0.4 | Build shared UI kit under `frontend/src/lib/components/ui` (Button, Input, Select, Switch, Card, Modal, Badge, Spinner, Skeleton, Table, Calendar, charts, …) | [x] | barrel `@/lib/components/ui` |
| 0.5 | Rebuild `/themetest` from kit only; calendar + charts | [x] | canonical lab |
| 0.6 | User selects variant → **canonical** locked | [x] | stakeholder decision |
| 0.7 | Full frontend theme/UX audit PDF | [x] | `.reports/Tawala_Frontend_Theme_UX_Audit_Report.pdf` |
| 0.8 | AGENTS.md §5 hard rules (colors, fonts/sizes, kit reuse) | [x] | includes font-size token rule |
| 0.9 | `.trackers/milestones.md` program plan | [x] | this file |

**Phase 0 exit criteria:** Tokens + kit + lab + agent rules + milestones exist on branch; no further foundation work without a new proposal.

---

## Phase A — Guardrails (stop the bleed)

**Goal:** Make it hard for agents/humans to reintroduce slate/emerald/one-off controls.

| ID | Task | Status | Notes |
|----|------|--------|-------|
| A.1 | AGENTS.md non-negotiable design rules | [x] | §5 |
| A.2 | Document forbidden classes + required imports in `frontend/theme.md` | [x] | 2026-09-14 |
| A.3 | Optional: ESLint restriction or CI grep for `bg-slate-` / `bg-emerald-` under `src/features` | [x] | `npm run check:theme` — strict on migrated paths, report-only elsewhere |
| A.4 | Trackers (`task.md` / `repo-state.md`) always name current phase ID | [ ] | ongoing hygiene |

**Phase A exit criteria:** Contributors cannot claim ignorance; optional automated check agreed.

---

## Phase B — Org shell chrome (HQ entry)

**Goal:** Org-level navigation and home use tokens + kit; one clear next action.

| ID | Task | Status | Primary files (indicative) |
|----|------|--------|------------------------------|
| B.1 | `OrgShell` + `Sidebar` → semantic tokens, kit Button/Badge where applicable; remove slate chrome | [x] | 2026-09-14 — OrgShell + Sidebar canonical; kit Skeleton |
| B.2 | Org home / command center hierarchy: single primary CTA when stores=0 or staff=0 or trial pressure | [x] | 2026-09-14 — tokens + recommended CTA when no branches |
| B.3 | Org settings + billing surfaces: kit forms, paywall message adjacent to blocked action | [x] | 2026-09-14 — OrgSettingsClient + billing page tokens |
| B.4 | Business layout chrome consistency with org shell (active nav, spacing tokens) | [x] | 2026-09-14 — layout type tokens; Sidebar already B.1 |

**Phase B exit criteria:** HQ routes pass AGENTS §5.4 checklist; no slate/emerald in org shell components.

---

## Phase C — Terminal + checkout (frontline money path) — **recommended first product migration**

**Goal:** Sell path uses kit; money hierarchy always wins; settle language is mint.

| ID | Task | Status | Primary files (indicative) |
|----|------|--------|------------------------------|
| C.1 | Terminal cockpit product grid + search chrome → tokens/kit; stock badge via Badge | [x] | 2026-09-14 — tokens on cockpit + product-card |
| C.2 | Cart sidebar / full cart → kit Button, amount classes, secondary for void | [x] | 2026-09-14 — settle CTAs brand-accent; tabular totals |
| C.3 | Checkout form: Total → method → customer(if credit) → Confirm; kit Input/Select/Button success | [x] | 2026-09-14 — total hero + success complete button |
| C.4 | Complete-sale success hierarchy + SuccessBanner patterns | [x] | 2026-09-14 — mint success / terracotta credit; amount-lg total |
| C.5 | Mobile sticky charge pattern aligned with DESIGN.md (&lt;768px) | [x] | 2026-09-14 — full-width bottom bar with item count + total |
| C.6 | Loading/empty/error: Spinner/Skeleton/Modal only; staged-sale recovery visible if present | [x] | 2026-09-14 — Spinner on complete-sale + terminal search; staged banner tokens |

**Phase C exit criteria:** Cashier can complete cash/M-Pesa/credit sale with canonical controls; tabular totals; no forbidden palette classes on these surfaces.

---

## Phase D — Customers, credit, inventory/stock

**Goal:** Credit recovery and stock count speak shop language; kit everywhere.

| ID | Task | Status | Notes |
|----|------|--------|-------|
| D.1 | Customers list: kit Input/Switch/Button/Table/Skeleton; empty state CTA | [x] | 2026-09-14 — semantic tokens; tabular open credit |
| D.2 | Customer detail tabs + collect credit: currency Input, success Button, SuccessBanner | [x] | 2026-09-14 — collect CTA brand-accent; workspace tokens |
| D.3 | Inventory product workspace chrome → tokens/kit | [x] | 2026-09-14 — ProductWorkspace/SmartRow/AssetComposer tokens |
| D.4 | Stock audit/restock **copy rewrite**: System qty / Counted qty / Difference / Why? | [x] | 2026-09-14 — AuditForm + RestockForm shop language |
| D.5 | Stock forms controls migrated to kit | [x] | 2026-09-14 — Button/Input/Select/Label/Textarea; StockTakingTableRow tokens |

**Phase D exit criteria:** Open-credit filter + collect path and stock count use plain language + kit.

---

## Phase E — Staff & secondary settings

| ID | Task | Status | Notes |
|----|------|--------|-------|
| E.1 | Team directory table + filters → tokens/kit; primary not emerald | [x] | 2026-09-14 — semantic tokens |
| E.2 | Staff member workspace | [x] | 2026-09-14 — role chips + chrome tokens |
| E.3 | Store form / business settings forms | [x] | 2026-09-14 — forms tokenized |

**Phase E exit criteria:** Admin surfaces match canonical chrome.

---

## Phase F — Public marketing isolation (last)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| F.1 | Decide: leave marketing/legal visual system isolated under `(public)` **or** restyle to canonical | [x] | 2026-09-14 — inherit canonical tokens; structure may differ |
| F.2 | Ensure marketing cannot redefine app shell CSS variables | [x] | 2026-09-14 — public layout docs + AGENTS §5.3 + theme.md |

**Phase F exit criteria:** Written decision + no token leakage into app shell.

---

## Receipt (bonus in Phase E push)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| R.1 | Redesign receipt/invoice client view to canonical tokens + clear money hierarchy | [x] | 2026-09-14 — `ReceiptClientView.tsx` |
| R.2 | Service fees on receipt/invoice snapshot + UI | [x] | 2026-09-25 — #396 enrich from sale + lines |
| R.3 | Thermal-first layout (~80mm slip) | [x] | 2026-09-25 — #397 |
| R.4 | Print/PDF via self-contained HTML + hidden iframe (not Tailwind clone) | [x] | 2026-09-26 — #399 |
| R.5 | Collect credit from invoice view (no Customers detour) | [x] | 2026-09-25 — #398 |

## Terminal / inventory (2026-09-25)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T.1 | Service fee + discount in staged `total_amount` | [x] | #390 #394 |
| T.2 | FE/BE tax-after-discount parity; tax feature gated to 0 | [x] | #394 #395 |
| T.3 | Stage lifecycle: clear cart, resume staged, cancel staged | [x] | #394 |
| T.4 | Product settings: category + UoM catalog dropdowns | [x] | #398 |

## Overview (2026-09-24)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| O.1 | Definition strip + settled vs open credit | [x] | #377 #369 |
| O.2 | Smooth trend chart + comparison callout | [x] | #378 #370 |
| O.3 | InsightsStrip, Month period, empty states | [x] | #379 |
| O.4 | Expense-aware Sales KPIs + expenses UI | [x] | #380 #381 #372 #373 |

---

## Cross-cutting (any phase)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| X.1 | Every UI PR updates this file (mark task `[x]` + date in notes) | [ ] | process |
| X.2 | Money always `tabular` / `amount-*` on touched surfaces | [ ] | continuous |
| X.3 | Destructive = Modal + `Button secondary` | [ ] | continuous |
| X.4 | `npm run lint` + `npm run build` green before PR ready | [ ] | continuous |

---

## Suggested order

1. Finish any remaining **Phase A** hygiene (A.2–A.3) if desired  
2. **Phase C** (frontline) **or** **Phase B** (HQ) — product choice  
3. Phase D → E → F  

**Do not start a phase without Engineer Mode approval for that phase’s proposal.**
