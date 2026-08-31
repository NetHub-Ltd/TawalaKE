# TAWALA CODEBASE FORENSIC AUDIT

**Version:** 1.0.0  
**Date:** 2026-08-31  
**Repository:** `https://github.com/NetHub-Ltd/TawalaKE.git`  
**Branch audited:** `dev` @ `f25f1b3` (Merge PR #148 — feat/org-staff-management-canonical)  
**Auditor role:** Codebase Forensic Engineer (read-only)  
**Target architecture references:** TAWALA_CORE_ARCHITECTURE, DOMAIN_BOUNDARIES, DOMAIN_CONTRACTS, SECURITY_MODEL, DOMAIN_MODEL

---

## 1. Executive Summary

TawalaKE is a **modular monolith** consisting of:

- A **FastAPI** (Python 3.12) backend using SQLModel/SQLAlchemy + PostgreSQL + Redis + Celery.
- A **Next.js** (App Router + Turbopack) frontend acting as both UI and BFF (Next.js API routes proxy to the backend).
- Multi-tenancy modelled as **Organization → Business (store/branch)** with a legacy `Tenant` table still present.
- Strong recent investment in **paywall/entitlements**, **staff management**, **stock mutation hardening**, and **RBAC**.
- Sales/checkout path is partially implemented and partially stubbed; inventory mutations are more mature than the sales route itself.
- No Desktop or Mobile clients exist. No formal domain-event bus, outbox, or cross-domain contract layer is present.
- Domain boundaries are emergent (by file/module naming and some comments) rather than enforced by architecture.

The system is a working multi-tenant POS + inventory + org/staff + billing foundation for Kenyan SMEs, with clear evidence of iterative hardening. It does **not** yet implement the target architecture’s domain isolation, generic Core vocabulary (Party, Document, Resource, etc.), event-driven side-effects, or multi-client contract surface.

---

## 2. Repository Overview

```text
TawalaKE/
├── AGENTS.md, README.md, TawalaKE_Code_Inspection_Report_...
├── .skills/          (agent design skills — product/backend/ui)
├── .trackers/        (repo-state, task, rollback — session continuity)
├── .github/workflows/ (test_backend, test_frontend, build_and_push)
├── backend/
│   ├── app/
│   │   ├── api/ (routes, deps, rbac_deps, paywall_deps)
│   │   ├── core/ (config, security, rbac, session, redis, mailer)
│   │   ├── crud/ (base + domain CRUDs)
│   │   ├── models/ (models.py is the main model file)
│   │   ├── schemas/
│   │   ├── services/ (paywall, audit)
│   │   ├── middleware/ (paywall)
│   │   ├── tasks/ (Celery worker)
│   │   └── utils/
│   ├── alembic/
│   ├── testing/
│   ├── Dockerfile, requirements.txt / pyproject.toml / uv.lock
├── frontend/
│   ├── src/app/ (App Router: (public), (organization)/org/[orgId]/[businessId]/...)
│   ├── src/app/api/v1/ (BFF routes)
│   ├── src/lib/ (api, auth, rbac, store, ...)
│   ├── package.json, next.config.ts, orval.config.ts
├── docs/ (billing, rbac, signup, legal, tawala.md, ...)
└── media/
```

**Apparent responsibilities**
- `backend/` — authoritative business logic, persistence, authz, paywall.
- `frontend/` — UI + BFF (proxies most mutations/reads to backend with session token).
- `.skills/` + `.trackers/` — AI-agent operating protocol (not runtime).
- `docs/` — product/billing/RBAC specifications (partially aligned with code).

---

## 3. Technology Stack

### Backend
- **Language / runtime:** Python ≥ 3.12
- **Framework:** FastAPI 0.136
- **ORM:** SQLModel + SQLAlchemy (async) + asyncpg
- **Validation:** Pydantic
- **Auth:** JWT (access + refresh), OAuth2PasswordBearer, NextAuth integration on frontend
- **Authorization:** Custom RBAC (`app/core/rbac.py` + `rbac_deps.py`)
- **Cache:** Redis + fastapi-cache2
- **Background:** Celery + Kombu
- **Migrations:** Alembic (many additive migrations)
- **Rate limiting:** slowapi / limits
- **Mail:** custom mailer
- **Testing:** pytest (+ coverage gate in CI)

### Frontend
- **Framework:** Next.js (App Router, Turbopack)
- **Language:** TypeScript
- **Auth:** NextAuth (`auth.ts`)
- **API client:** Orval-generated clients + hand-written BFF routes under `src/app/api/v1/`
- **State / data:** React patterns + local store; no global domain event layer observed
- **UI:** Custom + theme.md guidance

### Database / Infra
- **DB:** PostgreSQL (JSONB heavily used)
- **Cache:** Redis
- **Container:** Dockerfile (Python 3.12-slim + uv)
- **CI:** GitHub Actions (backend pytest, frontend tests, build/push)
- **Deploy target preference (from instructions):** k3s (manifests not present in repo root)

### Testing
- ~26 backend test modules covering auth, authz hardening, paywall, stock, staff, products, stores, sales, security, organization.
- Frontend test workflow exists; depth not fully enumerated in this pass.

---

## 4. Application Architecture

**Current shape (simplified):**

```text
Browser
  │
  ▼
Next.js (App Router + BFF /api/v1/*)
  │  (Bearer token from NextAuth session)
  ▼
FastAPI (/api/v1)
  ├── Middleware (CORS, IP logging, paywall middleware)
  ├── Deps (AuthUser, Session, Redis, require_permissions, require_paywall)
  ├── Routes (auth, organizations, business/stores, products, stock, staff, sales, payments, management)
  ├── CRUD / Services (stock_crud, sale_crud, paywall, audit, ...)
  ├── SQLModel models → PostgreSQL
  └── Redis (cache + entitlements)
```

Celery worker exists (`backend/app/tasks/worker.py`) but is not central to the observed request path.

No separate workers for domain events, no message broker for inter-domain communication, no Desktop/Mobile apps.

---

## 5. Current Domain Model (Discovered)

Discovered from models, routes, CRUDs, and frontend routes (not forced into target names):

| Capability | Evidence of implementation |
|------------|---------------------------|
| Organization / multi-business | Strong (Organization, Business, staff assignments) |
| Staff / RBAC | Strong (Staff, StaffRole, Permission matrix, business assignments) |
| Catalog (Product + Category) | Present |
| Inventory / Stock | Present + hardened mutations + StockHistory |
| Sales / Checkout | Partial (models + CRUD exist; `/sales/new-sale` is largely a stub; real path via stores/business + frontend BFF) |
| Payments | Models + limited routes |
| Customers | Model present |
| Billing / Plans / Subscriptions / Paywall | Strong (Plan, Subscription, PaywallService, feature gates, usage tracking) |
| Audit | Present (AuditEvent + record_audit) |
| Reporting / Analytics | Partial (SaleAnalyticsSummary model + some store analytics routes) |
| Purchasing / Suppliers / Accounting / CRM depth / Appointments / Loyalty | Not found as first-class domains |

---

## 6. Domain Ownership (Current)

- **Stock** claims ownership of product stock quantity mutations and `StockHistory` (`backend/app/crud/stock.py` docstring explicitly states Sales/store checkout must call into it).
- **Paywall** is a clear cross-cutting service owning plan limits/features and Redis cache.
- **Audit** is a shared service.
- **Sales** ownership is incomplete: models and some CRUD exist, but the primary HTTP route is a stub (`pass`).
- **Catalog** and **Organization/Staff** have clearer route + CRUD ownership.
- Many models live in a single `models.py` file (~877 lines) — no physical module-per-domain boundary.

---

## 7. Domain Dependencies

Observed coupling is primarily **shared models + direct CRUD/service calls + shared Staff context**, not formal contracts.

- Stock CRUD imports Product, Staff, StockHistory and performs tenant asserts.
- Routes depend on `require_permissions` + `require_paywall` + `AuthUser`.
- Frontend BFF depends on backend HTTP shapes.
- No event contracts; side-effects are inline or via audit service calls.

---

## 8. Domain Boundary Violations

**Finding (CONFIRMED):** Sales route does not yet implement the sale workflow.  
**Evidence:** `backend/app/api/routes/sales.py` — `create_sale` logs payload then `pass`.  
**Implication:** Actual checkout path lives under store/business routes and frontend BFF, so sales logic is not cleanly owned by a Sales domain module.

**Finding (LIKELY):** Stock ownership is documented but not yet fully enforced as the only mutation path for sales.  
**Evidence:** `stock.py` CRUD docstring requires Sales to call it; sales route is stubbed; checkout BFF hits `/business/checkout`. Full path of inventory deduction during sale requires deeper tracing of store checkout handler (not fully expanded in this pass).

**Finding (CONFIRMED):** Single models file contains all major entities (Tenant, Organization, Business, Staff, Product, Sale, Payment, Customer, StockHistory, AuditLog, Plan, Subscription, …).  
**Evidence:** `backend/app/models/models.py`.  
**Implication:** Physical boundary is weak; any module can import any model.

No widespread “Sales directly mutates inventory tables without stock_crud” smoking gun was found in the paths inspected; stock mutations appear centralized and defensive.

---

## 9. Database Architecture

**Primary models (from `models.py`):**  
Tenant, Organization, Plan, Subscription, StaffBusinessAssignment, Staff, PlatformUser, Business, Category, Product, StockHistory, Customer, SaleAnalyticsSummary, Sale, Payment, SaleItem, FinancialDocument, DataDeletionRequest, AuditLog (+ AuditEvent in separate file).

**Patterns observed:**
- UUID primary keys, soft-delete (`deleted_at`), timestamps via BaseMixin.
- Dual tenancy fields: `tenant_id` (legacy) + `organization_id` on many tables; `business_id` for operational scope.
- JSONB for flexible attributes / usage / meta.
- Enums for SaleStatus, PaymentMethod, StaffRole, StockMovementType, etc.
- Additive Alembic history (many migrations).

**God-model risk:** `models.py` is large and mixed-domain. Product carries both catalog and stock quantity fields (stock lives on Product, history in StockHistory).

---

## 10. Multi-Tenancy Analysis

**What is a tenant?**  
Operationally: **Organization**. Legacy `Tenant` model remains. Business = store/branch under an Organization.

**How context is obtained:**
- JWT claims include `organization_id`, optional `business_id`, role (`TokenData` in security.py).
- Staff record carries `organization_id` (and legacy `tenant_id`).
- Deps resolve `AuthUser` / current Staff; paywall and RBAC use `organization_id`.

**Enforcement:**
- Stock CRUD has explicit `_assert_tenant_product` (IDOR guard comparing caller org vs product org).
- RBAC + business assignments limit which businesses a MANAGER/CASHIER can touch.
- Paywall resolves entitlements by `organization_id`.
- Not every query path was proven to be automatically tenant-scoped by a global filter/RLS; enforcement is application-level and path-dependent.

**Defense in depth:** Present in stock and authz paths; not proven universal across every CRUD method. No evidence of PostgreSQL RLS.

**Background jobs:** Celery present; tenant-context propagation for workers not verified in this pass → **UNKNOWN** for async isolation safety.

---

## 11. RBAC / Authorization Analysis

**Roles:** OWNER, ADMIN, MANAGER, CASHIER (`StaffRole`).  
**Permissions:** Fine-grained enum (`org:read/write/billing/staff:manage`, `catalog:*`, `stock:*`, `sales:*`, `reports:read`) mapped in `ROLE_PERMISSIONS`.

**Enforcement:**
- FastAPI deps: `require_permissions(...)` in `rbac_deps.py`.
- Business scope via `StaffBusinessAssignment` (OWNER/ADMIN see all org businesses; others scoped).
- Redis caches permission lists / assignments (DB is source of truth; purge on change).
- Docs (`docs/rbac-tenant.md`) align with code.

**Frontend:** RBAC helpers exist under `frontend/src/lib/rbac`; UI can hide actions, but server remains authoritative.

**Multi-business membership:** Supported (one Staff, many business assignments). Different roles per business are not first-class; role lives on Staff, scope via assignments.

---

## 12. Identity / Business / Branch Model

| Concept | Current representation |
|---------|------------------------|
| User / Identity | Staff (and PlatformUser) |
| Tenant | Organization (primary) + legacy Tenant |
| Business / Branch | Business (under Organization) |
| Membership | Staff.organization_id + StaffBusinessAssignment |
| Role | Staff.role (enum) |
| Location | Not a first-class Location entity; Business acts as operational unit |

**Distinction quality:** Organization vs Business is clear. Party abstraction (Customer/Supplier/Employee as relationships to a Party) is **not** present — Customer is a standalone model. Employee ≈ Staff with login capability.

---

## 13. API Architecture

**Prefix:** `/api/v1`

Major routers (from `api_router.py`):
- `/auth`
- `/organizations`
- `/business` (stores) — commerce-gated
- `/staff` (+ legacy `/business/staff`)
- `/products` — commerce-gated
- `/stock` — feature-gated
- `/sales` (stub)
- `/payments`
- `/management` (admin, conditional)

**Gates:** `require_active_plan` + `require_paywall(feature…)` on commerce surfaces.

**BFF:** Next.js routes under `frontend/src/app/api/v1/**` forward to backend with session token (example: checkout → `${BACKEND_URL}/business/checkout`).

**Contract quality:** Hand-written + Orval-generated types. No formal versioned domain contracts as defined in target architecture.

---

## 14. Service Architecture

- **CRUD modules** act as the main application/domain services (`stock_crud`, `sale_crud` / checkout, product, store, organization, staff…).
- **Services package** is thin: `paywall.py`, `audit.py`.
- Routes often depend on CRUD + deps; some business logic lives in CRUD methods.
- No explicit application-service orchestration layer for multi-domain workflows (e.g. full checkout as a formal orchestrator).

**God-object risk:** Large models file; some CRUDs (stock especially) concentrate significant logic.

---

## 15. Event Architecture

**No domain-event bus, outbox, or message-oriented domain communication was found.**

- Audit is an explicit write (`record_audit`).
- Celery exists for background tasks; not observed as the primary domain-event mechanism.
- Side-effects of sales/stock appear synchronous and inline.

**Status:** NOT IMPLEMENTED relative to target Domain Contracts event model.

---

## 16. Idempotency

- Paywall and stock paths show defensive coding; unique constraints and request IDs appear in audit.
- No systematic `idempotency_key` on CreateSale / CreatePayment / ReceiveGoods contracts was confirmed across the sale path.
- **Gap (LIKELY):** Critical money/stock operations may be vulnerable to duplicate submission under retries without explicit keys.

---

## 17. External Integrations

- **M-PESA / payments:** Models and limited payment routes; provider adapter isolation not fully evidenced in this pass.
- **Email:** `mailer` for onboarding/reset.
- **SMS / other providers:** Not deeply evidenced.
- Paywall is internal (plans/subscriptions), not an external billing provider adapter in the inspected code.

Provider leakage risk is **UNKNOWN** without deeper payment route inspection.

---

## 18. Frontend Architecture

- **Structure:** App Router with `(public)` and `(organization)/org/[organizationId]/[businessId]/...` for POS, inventory, staff, settings, history, terminal, cart, checkout.
- **BFF:** Heavy use of Next.js route handlers that attach the session token and call backend.
- **Auth:** NextAuth.
- **Generated clients:** Orval under `lib/api/generated`.
- **Orientation:** Feature/page oriented around org + business context, not pure domain modules.

UI can hide unauthorized actions; server-side RBAC remains the real gate.

---

## 19. Multi-Client Readiness

| Client | Status |
|--------|--------|
| Web | Primary and only implemented client |
| Desktop | Not present |
| Mobile | Not present |

**API readiness:** REST + JWT is client-agnostic in principle.  
**Risks:** BFF logic and NextAuth session assumptions, browser-oriented flows, and incomplete sales API surface mean a Desktop/Mobile client would currently need either the BFF or new direct API work. Offline / hardware integration isolation is not present.

**Assessment:** PARTIAL — backend can serve multiple clients only after sales and other core contracts are completed and BFF assumptions are reduced.

---

## 20. Security Analysis

**Strengths (CONFIRMED):**
- JWT + refresh cookie patterns; rate-limited login.
- RBAC deps on sensitive routes.
- Stock IDOR guard (`_assert_tenant_product`).
- Paywall gates on commerce features.
- Audit service with independent commit option for deny paths.
- Secrets expected from environment (no secrets in repo observed).

**Concerns:**
- Application-level tenant filtering is path-dependent; absence of global automatic tenant filter / RLS raises risk of missed filters on new endpoints (**LIKELY**).
- Sales route stub means the “happy path” may live in less-reviewed store checkout code.
- Dual `tenant_id` / `organization_id` increases chance of inconsistent checks.
- Debug IP endpoint present in main.py (operational hygiene).

No concrete unauthenticated cross-tenant write was proven in the inspected paths; confidence remains **LIKELY** that isolation is good on hardened modules and weaker on unfinished ones.

---

## 21. Audit Trail

**Present:** `AuditEvent` model + `record_audit()` service.  
Captures actor (staff id, email, role), action, resource, organization_id, business_id, outcome, meta, request_id.  
Used from stock mutations and other sensitive paths.  
Independent session option for 403 paths.

This is a real business audit trail, not only application logs.

---

## 22. Observability

- Structured logging (loguru) with request IP middleware.
- Health endpoint.
- Redis/DB startup probes in application factory.
- Request correlation via optional `request_id` on audit.
- Full distributed tracing / metrics stack not observed.

---

## 23. Data Integrity

- Soft deletes, UUID PKs, FKs on major relations.
- Stock mutations write history rows.
- Enums for statuses.
- Paywall usage tracked in subscription JSONB.
- Incomplete sale route leaves integrity of end-to-end checkout as a **risk until fully traced**.

---

## 24. Important Business Workflows

**Checkout / Sale (CONFIRMED incomplete on primary route):**  
`POST /api/v1/sales/new-sale` → logs → `pass`.  
Real path: Frontend BFF `.../org/stores/sales/checkout` → backend `/business/checkout`.  
Sale + SaleItem creation exists in CRUD; stock deduction ownership claimed by stock_crud but end-to-end atomicity not fully verified here.

**Stock adjust / receive / count:** Hardened; commit-first, snapshot, non-raising response path after successful write (recent post-commit 500 work visible in comments/history).

**Staff management:** Canonical `/api/v1/staff` + legacy alias; org-level Team entry; recent PRs.

**Onboarding / org / plans / trial:** Present in auth + org routes + frontend onboarding flows.

---

## 25. Current Architecture Diagram

```text
[Browser]
    │
    ▼
[Next.js App Router + BFF /api/v1]
    │  Bearer (NextAuth session)
    ▼
[FastAPI create_application()]
    │ Middleware: CORS, IP log, paywall
    │ Deps: AuthUser, Session, Redis, RBAC, Paywall
    │
    ├── /auth
    ├── /organizations
    ├── /business (stores) ──► store CRUD / checkout
    ├── /products
    ├── /stock ──► stock_crud (tenant assert + history + audit)
    ├── /staff
    ├── /sales (stub)
    ├── /payments
    └── /management
            │
            ▼
     [SQLModel models] ──► [PostgreSQL]
            │
     [Redis] ◄── entitlements cache, fastapi-cache
            │
     [Celery worker] (present, not central to request path)
            │
     [AuditEvent writes]
```

---

## 26. Current Domain Dependency Diagram

```text
Organization / Staff / RBAC / Paywall
        │
        ├── Business (stores)
        │       │
        │       ├── Product (catalog + stock qty)
        │       │       │
        │       │       └── StockHistory ◄── stock_crud
        │       │
        │       ├── Sale / SaleItem / Payment  (partial)
        │       └── Customer
        │
        └── Audit (cross-cutting)
```

Coupling is mostly through shared models and Staff context rather than explicit contracts.

---

## 27. Target Architecture Comparison

| Principle | Status | Notes |
|-----------|--------|-------|
| Generic Core (Party, Document, Resource, Event…) | NOT IMPLEMENTED | Customer/Staff/Product are concrete; no Party |
| Domain boundaries (Catalog ≠ Inventory ≠ Sales) | PARTIAL | Stock claims ownership; Sales incomplete; single models file |
| Domain contracts (Command/Query/Event) | NOT IMPLEMENTED | Direct function/ORM calls |
| Event-driven side effects | NOT IMPLEMENTED | Inline + audit writes |
| Modular monolith with clear internal boundaries | PARTIAL | Modules by file, weak isolation |
| Multi-tenancy (Business = tenant boundary) | PARTIAL MATCH | Organization is real tenant; dual fields; app-level filters |
| RBAC + Scope | MATCH (with caveats) | Role + business assignments; good matrix |
| Server-side authorization | MATCH | Deps on routes |
| Multi-client (Desktop/Web/Mobile) | NOT IMPLEMENTED | Web only |
| Industry neutrality | PARTIAL | No industry hard-coding observed; capability flags via paywall |
| Audit trail | MATCH | Real AuditEvent |
| Idempotency | PARTIAL / UNKNOWN | Not systematic on all money/stock paths |
| Accounting / Purchasing / CRM depth | NOT IMPLEMENTED | |

---

## 28. Compatibility Matrix (excerpt)

| Architectural Requirement | Current Implementation | Status | Evidence |
|---------------------------|------------------------|--------|----------|
| Multi-tenancy | Organization + Business | PARTIAL | models.py, JWT claims, deps |
| Tenant isolation | App-level asserts + RBAC | PARTIAL | stock `_assert_tenant_product`; path-dependent |
| RBAC | StaffRole + Permission matrix | MATCH | core/rbac.py, rbac_deps.py, docs |
| Domain boundaries | File/module + comments | PARTIAL | stock docstring vs single models.py |
| Contracts | HTTP + CRUD | MISMATCH | No Command/Query/Event contracts |
| Event architecture | None | NOT IMPLEMENTED | — |
| Audit trail | AuditEvent + service | MATCH | services/audit.py |
| Multi-client API | Web + BFF | PARTIAL | No Desktop/Mobile |
| Inventory ownership | stock_crud | PARTIAL | Centralized mutations; sale path incomplete |
| Payment boundary | Limited | PARTIAL | models + thin routes |
| Accounting boundary | Absent | NOT IMPLEMENTED | — |
| Paywall / plan limits | PaywallService | MATCH | services/paywall.py, middleware, deps |
| Source of truth | Backend DB | MATCH | BFF proxies; no competing client DB |

---

## 29. Architectural Debt

**Critical**
- Incomplete primary sales route while checkout exists elsewhere → risk of divergent logic and incomplete invariants.
- Dual tenant identifiers (`tenant_id` + `organization_id`) → inconsistency risk.

**High**
- Single large models file → weak physical domain boundaries.
- No domain events / outbox → hard to add Accounting, Notifications, Reporting projections cleanly.
- Application-level tenant filtering without universal guarantee → future IDOR risk on new endpoints.

**Medium**
- BFF assumptions may complicate Desktop/Mobile.
- Stock quantity on Product model (catalog + inventory mixed at persistence level).
- Limited formal idempotency on critical mutations.

**Low**
- Debug endpoints, commented historical code in main.py, legacy route aliases (documented).

---

## 30. Refactorability Assessment

| Area | Assessment |
|------|------------|
| Complete sales route + force all stock changes through stock_crud | Easily / Moderately Refactorable |
| Introduce formal Command/Query services without changing storage | Moderately Refactorable |
| Split models.py into domain packages | Moderately Refactorable |
| Add domain events + outbox | Difficult but Possible (requires new infrastructure + migration of side-effects) |
| Introduce Party model + migrate Customer/Supplier | Difficult (data migration) |
| Full multi-client contract surface | Moderately Refactorable once sales API is complete |
| PostgreSQL RLS / automatic tenant filter | Moderately / Difficult depending on chosen strategy |
| Remove dual tenant fields cleanly | Moderately Refactorable with data migration |

Nothing inspected so far is obviously **structurally incompatible** with an incremental path, but several foundational gaps (events, Party, strict domain isolation) are non-trivial.

---

## 31. V1 vs V2 Evidence

**Evidence that V1 can evolve**
- Organization/Business/Staff/RBAC/Paywall already approximate target security and tenancy ideas.
- Stock mutation ownership is being deliberately centralized.
- Audit, soft-delete, UUID, additive migrations support evolutionary change.
- Tests exist for authz, paywall, stock, staff.
- Modular monolith already in place (no premature microservice mess).

**Evidence that may justify heavier migration / V2 thinking**
- Core vocabulary (Party, Document, Resource, generic Transaction) is absent; Customer/Staff/Product are concrete and mixed.
- No event architecture; side-effects are inline.
- Sales domain is incomplete while operational checkout exists on another path.
- Dual tenancy fields and path-dependent isolation increase risk of subtle data leaks during large refactors.
- Catalog and Inventory share the Product row for quantity.

**No overwhelming single reason for an immediate full rewrite was found.** Incremental evolution is plausible if domain contracts and isolation are introduced carefully; data model gaps (Party, pure Inventory quantity ownership, events) will drive migration cost.

---

## 32. Migration-Relevant Observations

- `Customer` → potential CRM Party + Customer relationship.
- `Staff` + `StaffBusinessAssignment` → Membership model.
- `Product.stock` → Inventory stock level entity separate from Catalog Product.
- `tenant_id` → deprecate in favour of `organization_id`.
- `Sale` / `SaleItem` / `Payment` → explicit Sales + Payments domain aggregates with snapshots.
- Subscription / Plan / usage JSONB → keep as Platform/Billing capability.
- AuditEvent → align with target Audit domain (already close).

Historical sales and stock movements will need careful mapping if aggregates are redesigned.

---

## 33. Missing / Unknown Information

- Full end-to-end checkout handler on `/business/checkout` (stock deduction atomicity, payment recording).
- Production PostgreSQL constraints / RLS (if any) beyond Alembic.
- Celery task tenant-context propagation.
- Complete payment provider adapter behaviour (M-PESA payload handling).
- Frontend test depth and e2e coverage of isolation.
- Runtime configuration of feature flags beyond paywall.
- Actual production traffic patterns and tenant counts.

---

## 34. Capability Inventory

```text
Organization / multi-business     ✓
Staff + RBAC + assignments        ✓
Auth (email/password, tokens)     ✓
Plans / Subscriptions / Paywall   ✓
Product catalog                   ✓
Stock adjust / receive / history  ✓
Sales / Checkout                  △ (models + partial paths; primary route stub)
Payments                          △
Customers                         △ (model; depth unclear)
Audit trail                       ✓
Reporting / analytics             △
Purchasing / Suppliers            ✗
Accounting                        ✗
CRM depth (notes, segments…)      ✗
Appointments / Services           ✗
Loyalty                           ✗
Desktop client                    ✗
Mobile client                     ✗
Domain events / outbox            ✗
```

---

## 35. Critical Findings

1. **Sales primary API is a stub** while real checkout lives under business/store + BFF — domain ownership of “Sale” is unclear and incomplete.  
2. **Tenant isolation is application-level and path-dependent**, with dual `tenant_id`/`organization_id` fields — good on hardened modules (stock, RBAC), not proven universal.  
3. **No domain-event / contract architecture** — target communication model is absent.  
4. **Single models file + stock quantity on Product** — Catalog/Inventory boundary is weak at persistence level.  
5. **Paywall, RBAC, Audit, Stock hardening are real strengths** and align partially with target security and inventory ownership goals.  
6. **Web-only** — multi-client readiness is incomplete until API surface and auth are fully client-agnostic.

---

## 36. Final Forensic Assessment

**Current architectural shape:**  
A practical multi-tenant modular monolith optimised for Kenyan SME POS + inventory + org/staff + SaaS billing. Security and paywall layers have received deliberate hardening. Domain structure is emergent (files, comments, some ownership rules) rather than contract-enforced.

**Major strengths:**  
RBAC matrix + business scope, paywall service, stock mutation centralisation and post-commit hardening, audit events, additive migrations, test coverage on authz/paywall/stock/staff, clear Organization→Business tenancy direction.

**Major structural problems:**  
Incomplete sales domain surface, missing event/contract layer, mixed Catalog/Inventory persistence, dual tenancy identifiers, weak physical domain isolation (one models file), Web-only client assumption.

**Security / data-isolation concerns:**  
Isolation depends on correct use of deps and asserts on each path. Hardened modules look solid; unfinished or less-reviewed paths (sales/checkout) are the higher risk. No RLS observed.

**Compatibility with target architecture:**  
Partial. Security, multi-business, capability gating, and inventory ownership direction are compatible starting points. Generic Core vocabulary, strict domain contracts, events, Party model, and multi-client experience are largely absent and will require substantial design + migration work.

**Likely scale of required change:**  
Medium-to-large evolutionary program if the target architecture is adopted seriously — not a trivial refactor, but also not an automatic “burn it down” case based on evidence seen. The architect should weigh migration cost of Party/Inventory split/events against the cost of continuing to grow on the current mixed model.

---

**End of forensic audit report.**

All conclusions above are derived from repository inspection on `dev` @ `f25f1b3`. No code was modified during the audit.
