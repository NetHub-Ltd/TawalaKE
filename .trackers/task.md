# Task — Core V2

## Authoritative scope source
Tawala Core V2 Implementation Roadmap (evidence-driven).  
GitHub issues #264–#276 (titles M11–M23) contain the full Objective / Acceptance criteria / Non-goals / Exit condition for each gate.

## Active alignment work (completed 2026-09-20)
- Created milestones M11–M23 (extending past product M0–M9).
- Rewrote issue bodies #264–#276 from the roadmap so future agents have zero ambiguity.
- Closed old T1–T13 milestones as `[SUPERSEDED]` (history preserved).
- This tracker update.

## Current authorized work
None beyond tracker alignment until a specific gate (starting with **M11**) is proposed and approved.

## Residual items mapped to new gates
- Live PostgreSQL multi-tenant HTTP E2E / isolation proof → **M12**
- Outbox publisher/worker → **M14**
- Full audit mutation coverage + universal idempotency → **M14**
- Empty-scope semantics hardening → **M13**
- Capability/Entitlement separation → **M15**
- Branch protection on `main` (#245) → product-side (out of Core scope)

## Hard rules (unchanged)
- Never open/merge PR from `core/**` → `main` or `dev`.
- No frontend on this branch.
- Proposal → approval before any non-trivial implementation.
- Tests (pytest + ruff) must stay green.
- Trackers travel with the code commits.

## Next recommended step
Propose **M11 — Core Gate Closure & Contract Freeze** (smallest coherent contract freeze before any further domain expansion).
