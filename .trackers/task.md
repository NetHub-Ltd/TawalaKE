# Task — Core V2

## Completed
- T1–T4 (contracts, postgres isolation, scope, audit/outbox)

## In progress
- **T5 Capability / Entitlement Kernel**
  - Models: Capability, BusinessEntitlement
  - EntitlementService + seed catalog
  - Routes + require_capability
  - POST /products gated on module.catalog
  - Migration 20260921_0003

## Next
T6 — Core Domain Contract Layer

## Hard rules
- Never PR core/** → main/dev
- SQLModel AsyncSession + session.exec for ORM
- Alembic is the only sync DB path
