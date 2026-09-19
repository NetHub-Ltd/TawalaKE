# V2 Core Program — Milestones

**Branch:** `core/v2`  
**Status:** Living board  
**Design reference:** `TAWALA_CORE_DESIGN.md`

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 0 — Isolation & blueprint

| ID | Milestone | Status | Acceptance | Tests |
|----|-----------|--------|------------|-------|
| P0.1 | `core/v2` created from main; product tree removed | [x] | No backend/frontend product code | Manual tree check |
| P0.2 | MERGE_POLICY + AGENTS + CI merge guard | [x] | Docs present; workflow blocks core→main/dev | Workflow file present |
| P0.3 | Trackers initialized for Core | [x] | repo-state / task / rollback current | Manual |
| P0.4 | `TAWALA_CORE_DESIGN.md` drafted | [x] | Blueprint covers layout, entities, relations, invariants | Review |
| P0.5 | Core Design accepted (incl. §12 answers) | [ ] | Written acceptance | N/A |
| P0.6 | Milestone board aligned to accepted design | [ ] | This file updated | N/A |

---

## Phase 1 — Identity & Membership (implementation later)

| ID | Milestone | Status | Acceptance | Tests |
|----|-----------|--------|------------|-------|
| P1.1 | User / Credential / Session model + commands | [ ] | Per design §4.1 | Unit + isolation |
| P1.2 | Membership lifecycle | [ ] | Invited→Active→Suspended→Revoked | State machine |
| P1.3 | TenantContext required on protected ops | [ ] | Missing context denies | Contract tests |

---

## Phase 2 — RBAC & Scope

| ID | Milestone | Status | Acceptance | Tests |
|----|-----------|--------|------------|-------|
| P2.1 | Role / Permission / assignments | [ ] | No owner bypass without audit | RBAC matrix |
| P2.2 | Scope (Branch/Location) | [ ] | Cross-scope denied | Scope negatives |
| P2.3 | IDOR suite for Core resources | [ ] | UUID guess fails | IDOR |

---

## Phase 3 — Organization, Parties, Catalog identity

| ID | Milestone | Status | Acceptance | Tests |
|----|-----------|--------|------------|-------|
| P3.1 | Business / Branch / Location | [ ] | FK + business_id everywhere | Isolation |
| P3.2 | Party + PartyBusinessLink | [ ] | Single identity model | Party tests |
| P3.3 | Product / Service **without** quantity | [ ] | Schema has no stock qty | Boundary |

---

## Phase 4 — Events, Audit, Configuration

| ID | Milestone | Status | Acceptance | Tests |
|----|-----------|--------|------------|-------|
| P4.1 | Event envelope + outbox interface | [ ] | Required fields; immutability | Envelope tests |
| P4.2 | AuditRecord append path | [ ] | Security ops audited | Audit assertions |
| P4.3 | BusinessConfig | [ ] | Business-scoped keys | Scope tests |

---

## Phase 5 — Core complete gate

| ID | Milestone | Status | Acceptance | Tests |
|----|-----------|--------|------------|-------|
| P5.1 | All invariants §8 encoded in tests | [ ] | CI green on core/v2 | Full suite |
| P5.2 | Import boundary enforced | [ ] | No domain imports in core | Arch tests |
| P5.3 | Design vs implementation compatibility matrix | [ ] | MATCH on Core sections | Review |

---

## Out of program (separate tracks)

- Product feature work on `main` / `dev`
- Domain modules Sales / Inventory / Payments implementation
- Data migration from product database
- Frontend / Desktop / Mobile clients
- Merge into `main` (forbidden)

---

## Definition of done (Core implementation)

- Phases 1–5 acceptance criteria met  
- Isolation and IDOR suites pass in CI on `core/v2`  
- No PR opened to `main` or `dev` from `core/**`  
- Trackers current on branch tip  
