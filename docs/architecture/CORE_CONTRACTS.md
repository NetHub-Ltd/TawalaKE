# Core Contracts — Authoritative Reference

**Branch:** `core/v2` only  
**Gate:** M11 — Core Gate Closure & Contract Freeze  
**Status:** Binding for all future domain work on this branch  
**Related:** `AGENTS.md`, `MERGE_POLICY.md`, `TAWALA_CORE_DESIGN.md`, `TAWALA_CORE_DEVELOPMENT_SPEC.md`

This document is the single place future domains must consult for cross-cutting Core guarantees.  
Domains **consume** these contracts. They do **not** invent parallel tenancy, authorization, audit, or transaction rules.

---

## 1. Required operation path

Every protected business operation must follow this path:

```text
Authenticated identity
        ↓
TenantContext
        ↓
Authorization
        ↓
Application / domain operation
        ↓
Persistence
        ↓
Audit / event where required
        ↓
Atomic commit
```

No domain may skip TenantContext construction or invent its own tenant ownership model.

---

## 2. TenantContext

**Authoritative implementation:** `backend/app/core_platform/shared/types.py`

```python
@dataclass(frozen=True, slots=True)
class TenantContext:
    business_id: UUID
    actor_user_id: UUID
    membership_id: UUID
    request_id: UUID
    permissions: frozenset[str] = field(default_factory=frozenset)
    branch_id: UUID | None = None
    location_id: UUID | None = None
```

### Rules

- Client-supplied `business_id` is **never** trusted without membership verification.
- `TenantContext` is constructed only by Core (see §3). Domain services receive it; they never build it from raw IDs alone.
- The object is immutable (`frozen=True`).
- Optional `branch_id` / `location_id` carry the requested scope; authorization decides whether that scope is allowed (see §4 and M13).

### Dependency rule for domains

```text
Domain service method signature should accept TenantContext (or an equivalent
Core-provided context object). It must not accept a bare business_id and then
perform its own membership lookup as a substitute for Core authorization.
```

---

## 3. Authentication → TenantContext construction

**Authoritative path:** `backend/app/api/deps.py`

1. `Authorization: Bearer <token>` → `IdentityService.resolve_user`
2. `business_id` from path or query (required)
3. Optional `branch_id` / `location_id` from query
4. `AuthorizationService.build_tenant_context(...)`  
   - Verifies active membership  
   - Loads permissions  
   - Applies scope checks  
   - Returns `TenantContext` or raises `DomainError`

FastAPI routes obtain context via:

```python
ctx: TenantContext = Depends(get_tenant_context)
# or
ctx: TenantContext = Depends(require_perms("some.permission.code"))
```

---

## 4. Authorization, membership, RBAC, scope

**Authoritative implementation:** `backend/app/core_platform/security/service.py`

- Membership is the gate between a user and a business.
- Permissions are code-based (`frozenset[str]` on `TenantContext`).
- `require_permission(ctx, code)` and the `require_perms(...)` dependency enforce permission checks.
- Scope assignments (`ScopeAssignment`) constrain branch/location access via `AuthorizationService.assert_scope`.

### Scope semantics (M13 — frozen)

| Situation | Behavior |
|-----------|----------|
| **No ScopeAssignment rows** (empty scope) | **Unrestricted within the business.** Membership + permissions authorize business access; HQ/Owner staff typically have no scope rows. |
| **Explicit ScopeAssignment rows** | Allowlist. If the request includes `branch_id` / `location_id` and the membership has at least one non-null assignment of that kind, the requested id **must** be in the allowed set or Core raises `FORBIDDEN` (`Branch out of scope` / `Location out of scope`). |
| **Request omits branch_id and location_id** | Business-level access only; no branch/location check. |
| **Revoked / soft-deleted assignments** | Ignored (`deleted_at` filtered). |

Domains receive `TenantContext` from Core (`get_tenant_context` / `require_perms`). They **must not** call services with a raw `business_id` as a substitute for Core authorization.

### Hard rule for future domains

- Domains **must** consume Core authorization (TenantContext + permission helpers).
- Domains **must not** implement local “is this user allowed?” checks that bypass Core.
- Scope semantics above are binding; do not invent alternatives.

---

## 5. Domain errors

**Authoritative implementation:** `backend/app/core_platform/shared/types.py`

```python
class DomainErrorCode(StrEnum):
    NOT_FOUND = "not_found"
    FORBIDDEN = "forbidden"
    UNAUTHORIZED = "unauthorized"
    CONFLICT = "conflict"
    VALIDATION_FAILED = "validation_failed"
    ALREADY_PROCESSED = "already_processed"

class DomainError(Exception):
    def __init__(self, code: DomainErrorCode, message: str) -> None: ...
```

HTTP mapping lives in `deps.py` / route handlers. Domains raise `DomainError`; they do not invent ad-hoc exception hierarchies for the same concepts.

---

## 5.1 Timestamps (timezone-aware UTC)

All Core timestamp columns are **timezone-aware UTC** (`TIMESTAMPTZ` in PostgreSQL).

- Factory: `app.models.base.utc_now()` → `datetime.now(UTC)`
- `BaseMixin.created_at` / `updated_at` / `deleted_at` use `DateTime(timezone=True)`
- Domain fields (`expires_at`, `occurred_at`, `invited_at`, …) follow the same rule
- Writers must not use naive `datetime.utcnow()`

## 6. Soft deletion

**Convention:** Models that support soft delete expose a nullable `deleted_at` timestamp.

- Queries that represent “live” data filter `deleted_at.is_(None)`.
- Soft-deleted rows remain for auditability and referential integrity.
- Hard deletes are exceptional and must be justified.

Authoritative pattern is visible across Core models (Membership, IdempotencyRecord, etc.).

---

## 7. Audit

**Authoritative implementation:**  
- Model: `backend/app/models/audit.py` (`AuditRecord`)  
- Service: `backend/app/core_platform/audit/service.py` (`AuditService`)

Minimum fields written for an auditable mutation:

- actor, business, resource type, resource ID, action, outcome, timestamp, request ID  
- before / after state where applicable  
- reason where applicable

### Convention

Auditable Core mutations call `record_activity` (audit + event) in the **same unit of work** as the mutation (`commit=False` then single service commit).

Canonical helper: `backend/app/core_platform/shared/activity.py`.

Core mutators covered: organization create/update paths, membership suspend/revoke, role assign, parties create/link, catalog product/service/category create & product update, **configuration set** (T4).

Identity register/login remain intentionally light (credentials path); expand when product policy requires session audit.

---

## 8. Domain events & Outbox

**Authoritative implementation:**  
- Models: `backend/app/models/events.py` (`DomainEvent`, `OutboxEntry`)  
- Emit: `backend/app/core_platform/events/service.py` (`EventService.emit`)  
- Publisher: `backend/app/core_platform/events/publisher.py` (`OutboxPublisher`)  
- Worker CLI: `python -m app.core_platform.events.worker`

Required atomic pattern:

```text
Domain mutation
    ↓
DomainEvent + OutboxEntry (PENDING)
    ↓
same DB transaction
    ↓
commit
    ↓
publisher claim (FOR UPDATE SKIP LOCKED)
    ↓
deliver → PUBLISHED  |  fail → FAILED + backoff / max attempts
```

- Events describe facts that occurred (not commands).
- Outbox entries are persisted with the source mutation.
- Default deliver sink is in-process (log success); inject a custom `deliver` coroutine for bus/webhook.
- Concurrent workers are safe via `SKIP LOCKED`.

---

## 9. Idempotency

**Authoritative helpers:** `backend/app/core_platform/shared/idempotency.py`  
**Model:** `backend/app/models/idempotency.py` (`IdempotencyRecord`)

- Scoped by `(scope, key)` unique constraint.
- `lookup` / `store` helpers; `require_key_format` validates key length (max 128).
- Duplicate requests with the same key must not create duplicate business effects (`store` returns prior row).
- **Command idempotency ≠ event deduplication** — outbox marks delivery once; command keys prevent double business creates.

### Command categories (Core policy)

| Category | Idempotency required? | Current Core coverage |
|----------|----------------------|------------------------|
| User registration | Yes (platform scope) | `IdentityService.register` |
| Membership invite | Yes (business scope) | `MembershipService.invite` |
| Catalog product create | Yes (business scope) | `CatalogService.create_product` |
| Config set | Optional (last-write-wins) | Not keyed; audit/event only |
| Read endpoints | No | — |

Future domains (payments, stock mutations, document finalization) **must** use command idempotency keys.

---

## 10. Application / domain service boundaries

- Business logic lives under `backend/app/core_platform/<area>/service.py`.
- Routes under `backend/app/api/routes/` are thin: auth → TenantContext → service → response.
- Services accept `TenantContext` (or session + context) and raise `DomainError`.
- Persistence uses the shared async session; commits are intentional and visible.

### Cross-domain transaction boundary

When a use-case spans multiple Core areas in one request:

1. One shared `AsyncSession`.
2. All writes (business + audit + event/outbox + idempotency record) occur on that session.
3. A single commit (or explicit rollback) ends the unit of work.
4. No domain opens a second independent transaction that can diverge from the first.

Domains must not “fire and forget” side effects outside this boundary without an explicit outbox/event design.

---

## 11. What domains must never do

| Forbidden | Reason |
|-----------|--------|
| Invent a parallel tenant context | Breaks isolation guarantees |
| Trust client `business_id` without Core membership check | IDOR / cross-tenant risk |
| Bypass `AuthorizationService` / permission helpers | Authorization becomes inconsistent |
| Own stock quantity inside Catalog | Inventory (M17) is the sole owner of stock |
| Own journal entries inside Sales/Purchasing | Accounting (M20) is the sole financial truth |
| Open PRs from `core/**` into `main` or `dev` | `MERGE_POLICY.md` |
| Add frontend on this branch | `AGENTS.md` |

---

## 12. Canonical locations (quick index)

| Concern | Location |
|---------|----------|
| TenantContext + DomainError | `core_platform/shared/types.py` |
| Auth → TenantContext deps | `api/deps.py` |
| Membership / RBAC / Scope / build_tenant_context | `core_platform/security/service.py` |
| Audit service | `core_platform/audit/service.py` |
| Events + Outbox service | `core_platform/events/service.py` |
| Idempotency helpers | `core_platform/shared/idempotency.py` |
| Soft-delete pattern | Model `deleted_at` + query filters |
| This contract document | `docs/architecture/CORE_CONTRACTS.md` |

---

## 13. Evolution

- Changes to these contracts require an explicit proposal and update to this file in the same commit(s).
- Later gates (M12–M23) refine or complete behavior; they must not silently replace the rules above without updating this document.
- Empty-scope semantics → **M13 (done):** empty = unrestricted within business.  
- Full audit / outbox publisher / universal idempotency → M14.  
- Capability vs permission separation → M15.

---

**M11 exit condition:** Every cross-cutting Core guarantee listed in the roadmap has one authoritative implementation or documentation location, and future domains have an explicit dependency rule for consuming Core.


---

## 14. PostgreSQL Row Level Security (M12)

**Authoritative implementation:** migration `20260920_0009_rls_tenant_isolation.py` + `app.db.session.set_tenant_guc`.

Defense-in-depth on business-scoped tables:

- `ENABLE` + `FORCE ROW LEVEL SECURITY`
- Policy keys off `app.current_business_id` (and memberships also allow `app.current_user_id` for auth resolution)
- `app.rls_bypass=on` is for seed/migration only — never for normal request handling

After `TenantContext` is built, `get_tenant_context` sets the tenant GUC for the remainder of the transaction.

Application authorization remains mandatory. RLS does not replace membership or permission checks.


---

## 15. SQLModel is the schema source of truth

- Domain persistence uses **SQLModel** models under ``app.models``.
- **Single baseline migration** ``20260920_0001`` — Alembic ``upgrade head`` applies DDL that mirrors ``app.models``.
- Process start: ``backend/start.sh`` runs ``alembic upgrade head`` then uvicorn. Do **not** call ``create_all`` at runtime.
- Session type is ``sqlmodel.ext.asyncio.session.AsyncSession`` everywhere (routes, services, tests).
- Status / type / kind fields are **VARCHAR** via ``str_enum_col`` (not native PostgreSQL ENUMs).
- RLS policies are applied after ``create_all`` (not expressible as SQLModel fields).
- Future schema changes: update SQLModel models, then a new revision that alters via metadata-driven migration (review before apply).


---

## 16. Database configuration

Credentials (preferred): ``DB_HOST``, ``DB_USER``, ``DB_PASSWORD``, ``DB_NAME``, optional ``DB_PORT``.

From those, Settings builds:

| URL | Driver | Used by |
|-----|--------|---------|
| ``database_url`` | ``postgresql+asyncpg://`` | SQLModel ``AsyncSession`` / app |
| ``database_url_sync`` | ``postgresql+psycopg://`` | Alembic ``upgrade`` |

Explicit ``DATABASE_URL`` / ``DATABASE_URL_SYNC`` still work (CI). Sync is derived from async if only async is set.

**Startup:** ``start.sh`` runs ``alembic upgrade head`` then uvicorn. FastAPI **lifespan** fails process start if Postgres is unreachable.

## 17. Capabilities & entitlements (T5 / M15)

Product **capabilities** are orthogonal to RBAC **permissions**:

| Axis | Question | Implementation |
|------|----------|----------------|
| Permission | May this *user* perform action X? | Membership → Role → Permission codes |
| Capability / Entitlement | Is feature X enabled for this *business*? | `Capability` catalog + `BusinessEntitlement` grants |

**Evaluation order** (deny by default at each step):

```text
Authenticate → Membership → RBAC permission → Entitlement → Scope → Domain rule → Audit
```

- Catalog seed: `backend/app/core_platform/entitlements/seed.py` (`module.*`, `limit.*`, `flag.*`)
- Service: `EntitlementService` (`has` / `require` / `limit` / `grant` / `revoke`)
- FastAPI: `require_capability("module.catalog")` in `app.api.deps`
- Example enforcement: `POST /api/v1/products` requires entitlement `module.catalog` in addition to `catalog.product.create`
- Missing or expired entitlement → `DomainErrorCode.FORBIDDEN`

Never overload RBAC permission strings as plan gates.

