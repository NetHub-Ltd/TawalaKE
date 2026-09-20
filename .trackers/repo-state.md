# Repository State — Core V2

- Branch: `core/v2`
- Isolation: **Never** open or merge PRs from `core/**` into `main` or `dev`
- Image name: `tawala-core:<sha>` only
- Preferred deploy target: k3s (Core-specific)
- Board: https://github.com/orgs/NetHub-Ltd/projects/5
- Architecture source of truth: `docs/architecture/` (including `CORE_CONTRACTS.md`)
- Last updated: 2026-09-20

## Milestone alignment

Product milestones M0–M9 remain untouched.

Core gates (roadmap M0–M12) are tracked as GitHub **M11–M23** (issues #264–#276).

| Roadmap | GitHub | Issue | Status |
|---------|--------|-------|--------|
| M0 | M11 Core Gate Closure & Contract Freeze | #264 | In progress (CORE_CONTRACTS.md added) |
| M1 | M12 Real PostgreSQL Isolation & Security Proof | #265 | Open |
| M2 | M13 Authorization & Scope Hardening | #266 | Open |
| M3 | M14 Audit, Event, Outbox & Idempotency Completion | #267 | Open |
| M4 | M15 Capability / Entitlement Kernel | #268 | Open |
| M5 | M16 Core Domain Contract Layer | #269 | Open |
| M6 | M17 Inventory Core | #270 | Open |
| M7 | M18 Sales Core | #271 | Open |
| M8 | M19 Purchasing Core | #272 | Open |
| M9 | M20 Accounting Core | #273 | Open |
| M10 | M21 CRM / Customer Intelligence Core | #274 | Open |
| M11 | M22 Reporting / Read Model Layer | #275 | Open |
| M12 | M23 Cross-Domain Integrity & Full Core Certification | #276 | Open |

## Implementation notes

Kernel foundation (identity, membership RBAC, scope assignment, parties, catalog identity with no-stock boundary, config, audit records, domain events + outbox persistence, selected idempotency) exists on this branch. Formal gate progress is tracked via M11–M23 acceptance criteria.
