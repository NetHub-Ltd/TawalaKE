# Tawala Core V2

**Branch:** `core/v2`  
**Status:** Architecture design (blueprint)  
**Isolation:** Non-mergeable into `main` / `dev` — see `MERGE_POLICY.md`

---

## What this branch is

A **clean-slate** design and future implementation space for **Tawala Core**.

It is derived from the architecture documents only:

- TAWALA_CORE_ARCHITECTURE
- TAWALA_DOMAIN_MODEL
- TAWALA_SECURITY_MODEL
- TAWALA_DOMAIN_BOUNDARIES
- TAWALA_DOMAIN_CONTRACTS

It does **not** borrow product code, models, routes, or frontend from `main`.

There is **no frontend** on this branch by design. Core is the business platform foundation; clients (Web / Desktop / Mobile) will consume Core APIs later.

---

## What this branch is not

- Not the current POS / inventory product
- Not a feature branch for `dev`
- Not mergeable into `main` or `dev`

---

## Documents

| Path | Purpose |
|------|---------|
| `MERGE_POLICY.md` | Binding non-merge rules |
| `docs/architecture/TAWALA_CORE_DESIGN.md` | Core blueprint (layout, data model, relationships, invariants) |
| `docs/architecture/V2_CORE_MILESTONES.md` | Program milestones, acceptance criteria, tests |
| `.trackers/` | Session continuity (repo-state, task, rollback) |

---

## Working rules

1. Design before code.
2. Update `.trackers/` with every material change.
3. Never open a PR from this branch into `main` or `dev`.
4. Never import or copy product implementation from `main`.

---

## Product branches

Current product continues only on `main` and `dev`. This branch does not affect production traffic.
