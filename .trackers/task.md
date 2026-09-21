# Task — Core V2

## Completed (T-series aligned)
- T1 Core Gate Closure & Contract Freeze (`CORE_CONTRACTS.md`)
- T2 Real PostgreSQL Isolation & Security Proof
- T3 Authorization & Scope Hardening
- **T4 Audit, Event, Outbox & Idempotency Completion** (this branch)
  - `OutboxPublisher` + worker CLI (`python -m app.core_platform.events.worker`)
  - Config `set` now emits audit + domain event
  - Contracts §7–9 updated with publisher pattern + idempotency categories
  - Tests: `tests/events/test_outbox_publisher.py`, `tests/unit/test_idempotency_semantics.py`

## Next
T5 — Capability / Entitlement Kernel

## Hard rules
- Never PR `core/**` → `main`/`dev`
- No FakeSession for isolation guarantees
- No frontend on this branch
