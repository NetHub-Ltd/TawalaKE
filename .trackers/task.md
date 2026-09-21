# Task — Core V2

## Completed
- T1–T5 (contracts, isolation, scope, audit/outbox, entitlements)

## In progress
- **T6 Core Domain Contract Layer**
  - DOMAIN_CONTRACTS.md (Org / Party / Catalog ownership)
  - Structural invariant tests (no stock on Product)
  - CORE_CONTRACTS §18 pointer

## Next
T7 — Inventory Core (when scheduled)

## Hard rules
- Never PR core/** → main/dev
- SQLModel AsyncSession + session.exec
- Catalog ≠ Inventory
