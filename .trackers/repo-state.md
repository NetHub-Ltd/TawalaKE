# Repository State — Core V2

- Branch: `core/v2`
- HEAD: 397a50d (`feat(core): P1 Category, Config, and Scope assignment APIs`)
- Isolation: **Never** open or merge PRs from `core/**` into `main` or `dev` (see `MERGE_POLICY.md` and `AGENTS.md`)
- Image name: `tawala-core:<sha>` only
- Preferred deploy target: k3s (Core-specific, never product POS workload)
- Board: https://github.com/orgs/NetHub-Ltd/projects/5
- Architecture source of truth: `docs/architecture/` + roadmap document
- Last updated: 2026-09-20

## Milestone alignment (2026-09-20)

Product milestones M0–M9 remain untouched (auth/RBAC/frontend series).

Core gates were realigned to extend the M-series and preserve history:

| Roadmap | GitHub milestone | Issue |
|---------|------------------|-------|
| M0 | **M11** — Core Gate Closure & Contract Freeze | #264 |
| M1 | **M12** — Real PostgreSQL Isolation & Security Proof | #265 |
| M2 | **M13** — Authorization & Scope Hardening | #266 |
| M3 | **M14** — Audit, Event, Outbox & Idempotency Completion | #267 |
| M4 | **M15** — Capability / Entitlement Kernel | #268 |
| M5 | **M16** — Core Domain Contract Layer | #269 |
| M6 | **M17** — Inventory Core | #270 |
| M7 | **M18** — Sales Core | #271 |
| M8 | **M19** — Purchasing Core | #272 |
| M9 | **M20** — Accounting Core | #273 |
| M10 | **M21** — CRM / Customer Intelligence Core | #274 |
| M11 | **M22** — Reporting / Read Model Layer | #275 |
| M12 | **M23** — Cross-Domain Integrity & Full Core Certification | #276 |

Old T1–T13 milestones closed as `[SUPERSEDED]` for history.

## Current implementation notes

- Kernel / foundation work that existed before the roadmap alignment remains on this branch (identity, membership RBAC, scope assignment, parties, catalog identity with no-stock boundary, config, audit records, domain events + outbox persistence, selected idempotency, FastAPI/SQLModel, migrations, CI isolation policy).
- Formal gate status is now driven by the M11–M23 issues and their acceptance criteria. Do not treat the previous informal “M11 complete” note as the roadmap M11 gate.
