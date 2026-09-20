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

Auditable Core mutations should call `AuditService` in the **same unit of work** as the mutation (same session / same eventual commit) so audit and business state stay consistent.

Full mutation coverage and automated guarantees are completed under **M14**.

---

## 8. Domain events & Outbox

**Authoritative implementation:**  
- Models: `backend/app/models/events.py` (`DomainEvent`, `OutboxEntry`)  
- Service: `backend/app/core_platform/events/service.py`

Required atomic pattern:

```text
Domain mutation
    ↓
DomainEvent + OutboxEntry
    ↓
same DB transaction
    ↓
commit
```

- Events describe facts that occurred (not commands).
- Outbox entries are persisted with the source mutation.
- Publisher / worker (claim → deliver → retry → mark processed) is completed under **M14**.

---

## 9. Idempotency

**Authoritative helpers:** `backend/app/core_platform/shared/idempotency.py`  
**Model:** `backend/app/models/idempotency.py` (`IdempotencyRecord`)

- Scoped by `(scope, key)`.
- `lookup` / `store` helpers; `require_key_format` validates key length.
- Duplicate requests with the same key must not create duplicate business effects.
- Event deduplication ≠ command idempotency (distinct concerns).

Selected operations already use the helpers. Universal command-category policy and PostgreSQL-backed proof are completed under **M14**.

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
- Alembic ``target_metadata = SQLModel.metadata``; prefer ``alembic revision --autogenerate``.
- Status / type / kind fields are **VARCHAR**, not native PostgreSQL ENUMs (see ``str_enum_col``).
- Application and tests use the ORM session (``AsyncSession`` / SQLModel) — no parallel schema definitions.
