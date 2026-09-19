# Task — Core V2

## Goal

Establish an isolated `core/v2` branch and produce the **Tawala Core design blueprint** (layout, database design, relationships, invariants, contracts ownership) aligned to the architecture documents. No product code. No frontend.

## Approved scope

- [x] Create `core/v2` from `main`
- [x] Clean-slate: remove product application tree
- [x] MERGE_POLICY + AGENTS + trackers
- [x] CI guard against merge to main/dev
- [ ] Draft `docs/architecture/TAWALA_CORE_DESIGN.md` (blueprint)
- [ ] Draft `docs/architecture/V2_CORE_MILESTONES.md`
- [ ] User review / acceptance of Core Design

## Explicitly out of scope (this task)

- Implementing SQLAlchemy/SQLModel tables
- Implementing APIs or auth runtime
- Migrating product data
- Frontend of any kind
- Merging into `main` or `dev`

## Decisions

- Clean-slate: strict (no product code retained)
- Core = design first (what the code will do), then implementation later
- Tenant boundary = Business (per architecture docs)

## Risks

- Operator must still set GitHub branch protection to fully block `core/**` → `main`
- Design must not reintroduce dual tenancy fields or Catalog+Inventory mix

## Verification

- Branch contains no `backend/` or `frontend/` product code
- MERGE_POLICY and CI guard present
- Trackers accurate
