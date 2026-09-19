# V2 Core Program — Milestones & Issues

**Branch:** `core/v2`  
**Spec:** `TAWALA_CORE_DEVELOPMENT_SPEC.md` (authoritative for models, endpoints, CI)  
**Design:** `TAWALA_CORE_DESIGN.md`  
**Isolation:** `MERGE_POLICY.md`

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

Agents: if `.trackers/` are stale, follow **SPEC Part A resume protocol** and this board.

---

## Phase 0 — Isolation & documentation

| ID | Milestone | Status | Acceptance |
|----|-----------|--------|------------|
| M0.1 | `core/v2` clean-slate + MERGE_POLICY + CI merge guard | [x] | Product tree gone; guard workflow present |
| M0.2 | CORE_DESIGN + DEVELOPMENT_SPEC drafted | [x] | Docs on branch |
| M0.3 | Spec accepted (models, endpoints, sequence) | [x] | User: spec approved 2026-09-19 |
| M0.4 | GitHub branch protection on `main` (operator) | [ ] | core→main PR cannot merge |
| M0.5 | GitHub Project board + issues M1–M11 created | [ ] | Issues link to SPEC sections |

---

## Phase 1 — Structure, CI, images foundation

| ID | Milestone | Status | Acceptance | Tests / checks |
|----|-----------|--------|------------|----------------|
| M1 | Backend skeleton | [x] | Tree per SPEC Part C; FastAPI `/health` | pytest health 2 passed |
| M2 | Core CI pipeline | [~] | `core-ci.yml`: lint + pytest (skeleton) | workflow present; local ruff+pytest green |
| M3 | DB + Alembic bootstrap | [ ] | Engine + empty/first migration path | `alembic upgrade head` |
| M10 | Image build pipeline | [ ] | `Dockerfile` + `core-image.yml`; tag `tawala-core:<sha>` only | Image builds; **not** product `tawala-api` |

Note: M10 may proceed once M1 skeleton exists.

---

## Phase 2 — Identity & organization

| ID | Milestone | Status | Acceptance | Tests |
|----|-----------|--------|------------|-------|
| M4 | Identity models + auth API | [ ] | SPEC D.1 + F.2 | `tests/identity/` |
| M5 | Organization models + API | [ ] | SPEC D.2 + F.3 | `tests/isolation/` start |

---

## Phase 3 — Security

| ID | Milestone | Status | Acceptance | Tests |
|----|-----------|--------|------------|-------|
| M6 | Membership, roles, permissions, authz | [ ] | SPEC D.3 + F.4 | membership, rbac, scope suites |

---

## Phase 4 — Parties & catalog

| ID | Milestone | Status | Acceptance | Tests |
|----|-----------|--------|------------|-------|
| M7 | Parties + links | [ ] | SPEC D.4 + F.5 | IDOR + list by business |
| M8 | Catalog products/services (no quantity) | [ ] | SPEC D.5 + F.6 | catalog rejects quantity |

---

## Phase 5 — Events, audit, config, complete

| ID | Milestone | Status | Acceptance | Tests |
|----|-----------|--------|------------|-------|
| M9 | Events, outbox, audit, config | [ ] | SPEC D.6 | Audit on revoke; event append |
| M11 | Core complete gate | [ ] | Full SPEC Part H suite green | Full CI |

---

## Issue template (copy into GitHub issues)

```markdown
## Spec reference
TAWALA_CORE_DEVELOPMENT_SPEC.md — section(s): …

## Deliverables
- [ ] Models / migrations
- [ ] Schemas
- [ ] Service class(es)
- [ ] Routes
- [ ] Tests listed in milestone

## Out of scope
- Frontend
- Product main/dev merge
- Sales/Inventory/Payments

## Acceptance
CI green on core/v2 for this milestone’s tests.
```

---

## Non-merge reminder

```text
Never: PR core/v2 → main or dev
Never: tag Core image as production tawala-api
Never: copy product models into Core
```

---

## Definition of Core complete

- M0–M11 acceptance criteria met
- SPEC Part H suites pass
- Isolation layers active (policy + CI + branch protection)
- Trackers current on branch tip
