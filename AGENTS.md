# Agent Operating Instructions

> **Mandatory for all AI agents working on this repository.**

## 1. Load Skills First — Non-Negotiable

Before reading code, proposing changes, or implementing anything, the agent **must**:

1. Read every file in `.skills/`.
2. Apply the relevant skills to the task at hand.
3. Use the smallest skill set that can answer the task (per `SKILL_INDEX.md`).

The `.skills/` directory contains authoritative design, engineering, security, and testing guidance. No agent should begin work without loading the skills that apply to the current task.

### Skill files (three domains)
- `SKILL_INDEX.md` — start here; maps tasks to domains
- `DESIGN_SKILL_PROTOCOL.md` — mandatory design reasoning sequence
- `product/product-design.md` — product design & planning (outcomes, scope, evaluation)
- `backend/backend-design.md` — backend design practices (API, data, security, tests)
- `ui/ui-design.md` — UI (behavior baseline, look & feel, operational patterns, optional autonomy)

## 2. Follow Tracker Protocol Second

After loading skills, inspect `.trackers/`:
- `repo-state.md` — where is the repository right now?
- `task.md` — what are we authorized to do?
- `rollback.md` — how do we safely recover?

If `.trackers/` does not exist, initialize it before beginning implementation work.

## 3. Engineer Mode Protocol

This repository also operates under Engineer Mode (see agent engineer skill / protocol). Key rules:
- Protect `main` / `master` — no direct pushes.
- Propose before implementing non-trivial work.
- Wait for explicit approval.
- Use topic branches (`feat/`, `fix/`, `chore/`, `docs/`).
- Open PRs into **`dev`** (create `dev` from default branch if missing); do not merge unless authorized.
- Verify tests, lint, typecheck, and builds pass.
- Update trackers with every state change.

## 4. Priority Order

User outcome → usability → security → accessibility → clarity/hierarchy → consistency → performance → visual polish.

---

## 5. Design System & UI Kit — Non-Negotiable

**Canonical theme:** Modern Retail Operating System (DESIGN.md) — locked **canonical** variant.

**Sources of truth (do not fork):**
| Concern | Location |
|---------|----------|
| Tokens, surface gradient, type scale, radii, shadows | `frontend/src/app/globals.css` |
| Fonts | `frontend/src/app/layout.tsx` (Plus Jakarta Sans + Inter + mono) |
| Reusable components | `frontend/src/lib/components/ui/` via `@/lib/components/ui` |
| Visual reference lab | `/themetest` |
| Human-readable summary | `frontend/theme.md` |

### 5.1 Forbidden in product UI (`frontend/src/features/**`, app product routes)

Agents **must not**:

1. **Hardcode colors** — no raw hex (`#6366f1`, `#fff`, …) and no Tailwind palette utilities for chrome:
   - Forbidden examples: `bg-slate-*`, `text-slate-*`, `border-slate-*`, `bg-gray-*`, `bg-zinc-*`, `bg-indigo-*`, `bg-blue-*`, `bg-violet-*`, `bg-purple-*`, `bg-emerald-*`, `bg-green-600`, `bg-red-50` (use semantic error tokens), `bg-white` / `bg-black` as surfaces.
2. **Hardcode fonts or font sizes** — no arbitrary `text-[13px]`, `text-[11px]`, `text-3xl`, custom `fontFamily`, or third-party display fonts in product UI.
   - Use only theme type roles from `globals.css`: `text-h1` / `text-h2` / `text-h3` / `text-h4`, body via default/`text-sm`/`text-xs` mapped to tokens, `amount-lg` / `amount-md` / `tabular` for money.
   - Font families come only from layout CSS variables (`--font-jakarta`, `--font-inter`, `--font-mono`) via `@theme` — never load alternate families in feature code.
3. **Bypass the UI kit** for standard controls — do not invent one-off `<button>` / `<input>` / `<select>` / toggle / modal / badge / spinner styling when an equivalent exists in `@/lib/components/ui`.
4. **Introduce new design tokens** without updating **all** of: DESIGN.md (or project design source), `globals.css`, and `/themetest`.
5. **Override global surface/font/radius systems** with page-local CSS that conflicts with canonical tokens.
6. **Use marketing type voice on operational UI** — avoid `font-black` + `uppercase` + `tracking-widest` on POS, checkout, inventory, and admin task chrome.

### 5.2 Required patterns

1. **Import shared components:**
   ```ts
   import { Button, Input, Card, Badge, Spinner, Modal } from "@/lib/components/ui";
   ```
2. **Semantic tokens only** for surfaces, text, and type scale: `bg-background`, `bg-card`, `bg-register`, `text-foreground`, `text-muted`, `border-border`, `bg-brand-primary`, `bg-brand-secondary`, `bg-brand-accent`, error/success CSS variables, and type roles (`text-h1`…`text-h4`, `amount-*`, `tabular`). No one-off pixel font sizes.
3. **Button roles:**
   - Command / primary CTA → `Button` `variant="primary"`
   - Void / destructive / urgent → `variant="secondary"` (terracotta)
   - Pay / settle / collect money → `variant="success"` (mint)
4. **Money:** always `tabular` / `amount` / `amount-md` / `amount-lg` classes — never proportional digits for KSh columns.
5. **Settlement feedback:** `SuccessBanner` or mint success patterns — not ad-hoc green.
6. **Destructive confirm:** `Modal` + explicit confirm; no silent deletes.
7. **Loading:** `Spinner` / `Skeleton` from the kit.
8. **Responsiveness:** use global spacing/type tokens and existing breakpoints; do not invent a second spacing scale on a feature page.
9. **Hit targets:** primary actions remain **48px** (`size="md"` default on `Button`).

### 5.3 Exceptions

- **Public marketing / legal / blog** (`src/app/(public)/**`) may use different page structure and longer prose, but:
  - **Must inherit** root `globals.css` tokens (no second `:root` palette, no alternate display fonts).
  - **Must not** set `--brand-*`, `--background`, `--surface`, or font CSS variables on public wrappers.
  - Mark public shell with `data-shell="public"` (see public layout).
- A one-off control is allowed only when the PR description states **why** the kit is insufficient and adds a follow-up to extend the kit.
- Chart libraries: prefer kit `BarChart` / `LineChart` unless a documented dependency is approved.

### 5.4 Definition of done (UI PRs)

- [ ] No new forbidden palette classes in product features
- [ ] Interactive controls from `@/lib/components/ui` (or documented exception)
- [ ] Primary task clear within ~3 seconds; money tabular
- [ ] Loading, empty, and error states for the flow’s failure modes
- [ ] `npm run lint` and `npm run build` pass in `frontend`
- [ ] `/themetest` still reflects canonical reference if tokens changed

---


## 6. Ecosystem Auth Program — Mandatory Progress Check (Non-Optional)

> **Until this program is fully complete, every AI agent session on this repository MUST check and report auth-program progress before doing other work.**

This is **not optional**. It applies to every agent, every session, regardless of the user’s stated task (unless the user is explicitly only asking about something that cannot wait and still requires a one-line auth status).

### 6.1 Program identity

| Item | Value |
|------|--------|
| **Goal** | Keycloak (IdP) → NetHubKe (AS) → Tawala hard session + PIN soft session; staff only in Tawala; owners/billing via NetHub; no per-request hop to NetHub |
| **Project board** | https://github.com/orgs/NetHub-Ltd/projects/3 |
| **Umbrella issue** | https://github.com/NetHub-Ltd/TawalaKE/issues/238 |
| **Milestones** | M0–M9 on TawalaKE (GitHub milestones titled `M0` … `M9`) |
| **Issue range** | #220–#237 (work items) + #238 (tracker) |

### 6.2 Required actions at session start

Before implementing **any** feature, fix, or refactor, the agent **must**:

1. Open or query the **project board** and/or issues #220–#238.
2. Determine:
   - Which milestone is the **current** one (first incomplete M0→M9 in order)
   - Which issues in that milestone are open vs closed
   - Whether any **feature flags** for later milestones have been enabled early (they must not be, without explicit approval)
3. **Report a short status block** to the user, for example:

```text
Auth program: M2 in progress — #225 open, #226 closed. Legacy staff login still required. Next: NetHubKe exchange.
```

4. **Refuse to skip milestones.** Work proceeds **M0 → M1 → … → M9** unless the user explicitly reprioritizes **within** the approved non-blocking plan (e.g. docs in parallel). Agents must **not**:
   - Start **M9** (#237 — deprecate legacy staff password login) until M8 is done **and** the user gives **written approval** again at cutover time
   - Disable legacy `/auth/login` or force dual-gate in production while earlier milestones are incomplete
   - Put cashier/staff rows in NetHubKe’s database
   - Add per-request NetHub introspection on POS hot paths

5. If the user’s request conflicts with the above (e.g. “remove password login now”), the agent must **decline**, explain the dependency on M0–M8, and point at the board.

### 6.3 Non-blocking rule (reminder)

Every stage until cutover ships **behind flags default off** (or docs-only). Current staff email/password JWT auth remains the production path until **M9 is explicitly approved after M8**.

### 6.4 When the program is “fully done”

Only when:

- [ ] M0–M8 acceptance criteria met
- [ ] M9 closed with explicit cutover approval
- [ ] Umbrella #238 closed
- [ ] Project board shows program complete

After that, this section may be removed or reduced in a dedicated docs PR. Until then, **agents must keep checking progress every session.**

---

## 7. Session Start Checklist

```
[ ] Read all relevant `.skills/` files
[ ] **Auth program progress check (section 6) — mandatory until #238 closed**
[ ] Report short auth milestone status to the user
[ ] Read `.trackers/repo-state.md`
[ ] Read `.trackers/task.md`
[ ] Read `.trackers/rollback.md`
[ ] Verify tracker state against actual Git state
[ ] Identify current task scope (do not skip auth milestones M0–M9 order)
[ ] For UI work: re-read section 5 (Design System & UI Kit)
[ ] Propose before implementing non-trivial work
[ ] Wait for approval
[ ] Implement on topic branch
[ ] Verify (tests, lint, build)
[ ] Update trackers
[ ] Open PR into dev
```

---
**Last updated:** 2026-09-16  
**Skills version:** 1.0.0  
**Theme:** Canonical Modern Retail OS (locked)
