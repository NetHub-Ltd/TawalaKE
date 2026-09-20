# Task — Core V2

## Authoritative scope source
Tawala Core V2 Implementation Roadmap.  
GitHub issues #264–#276 (M11–M23) contain full Objective / Acceptance criteria / Non-goals / Exit condition.

## Completed
- **2026-09-20** Milestone realignment: Core gates tracked as M11–M23 (product M0–M9 preserved). Issues #264–#276 rewritten from roadmap. Trackers aligned.
- **2026-09-20 M11** Core Gate Closure & Contract Freeze:
  - Added `docs/architecture/CORE_CONTRACTS.md` (authoritative contracts for TenantContext, auth path, authorization consumption rule, DomainError, soft-delete, audit, events/outbox, idempotency, service boundaries, transaction pattern, forbidden practices).
  - Module pointers on `shared/types.py` and `api/deps.py`.
  - No runtime behavior change. Existing tests expected green.

## Current authorized work
M11 implementation (this commit). After push, M11 acceptance criteria should be reviewed against CORE_CONTRACTS.md.

## Residual / next gates
- M12 — Real PostgreSQL Isolation & Security Proof
- M13 — Authorization & Scope Hardening (empty-scope semantics)
- M14 — Audit, Event, Outbox & Idempotency Completion
- M15+ — Capability kernel and domain layers

## Hard rules
- Never open/merge PR from `core/**` → `main` or `dev`.
- No frontend on this branch.
- Proposal → approval before non-trivial work.
- Tests (pytest + ruff) must stay green.
