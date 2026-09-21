# Task — Core V2

**Branch HEAD:** `core/v2` (post PR #287 credentials/loguru/lifespan)  
**Updated:** 2026-09-22

## Completed (merged into core/v2)
| T-series | Board issue | Notes |
|----------|-------------|--------|
| T1 | (contracts / gate) | CORE_CONTRACTS |
| T2 | — | RLS / tenant isolation |
| T3 | — | Authorization hardening |
| T4 | #267 M14 | Audit, outbox, idempotency — **closed** |
| T5 | #268 M15 | Capability / entitlements — **closed** |
| T6 | #269 M16 | Domain contracts — **closed** |
| T7 | #270 M17 | Inventory — **closed** |
| T8 | #271 M18 | Sales — **closed** |
| T9 | #272 M19 | Purchasing — **closed** |
| T10 | #273 M20 | Accounting — PR #283 — **closed** |
| T11 | #274 M21 | CRM — PR #284 — **closed** |
| Ops | — | Docker 3.13, postgres URL, credentials-only DB, loguru — PRs #285–#287 |

## In progress
- **T12 / #275 M22 — Reporting / Read Model Layer** → PR #288 (`feat/t12-reporting-read-models`)

## Remaining (board)
- **#275** M22 Reporting — open until PR #288 merges
- **#276** M23 / **T13** Cross-Domain Integrity & Full Core Certification — not started

## Product issues (not Core)
Auth / ecosystem issues on main/dev (e.g. #224–#244, #238) are out of scope for `core/v2`.
