# Tawala Core V2

**Branch:** `core/v2`  
**Status:** Core domain foundation **complete** (T1–T13 / M11–M23)  
**Runtime:** Python 3.13 · FastAPI · PostgreSQL · SQLModel (async)  
**Image:** `tawala-core` only — **never** `tawala-api`

This branch is an **isolated platform core**: tenancy, identity, RBAC, catalog, inventory, sales, purchasing, accounting, CRM, and reporting. It is **not** the product POS on `main` / `dev`.

---

## 1. Hard isolation

| Rule | Detail |
|------|--------|
| Merge to `main` / `dev` | **Forbidden** |
| Product code reuse | Do not copy POS models/routes from `main` |
| Frontend | **None** on this branch by design |
| Image name | `tawala-core:<sha>` only |

Binding policy: [`MERGE_POLICY.md`](./MERGE_POLICY.md) · Agent rules: [`AGENTS.md`](./AGENTS.md)

Project board: [NetHub-Ltd project #5](https://github.com/orgs/NetHub-Ltd/projects/5)

---

## 2. Documentation map

Start here, then drill into architecture docs as needed.

| Document | Role |
|----------|------|
| **This README** | Orientation, runbook, domain map, API surface |
| [`docs/architecture/CORE_ARCHITECTURE_MAP.md`](./docs/architecture/CORE_ARCHITECTURE_MAP.md) | **Certification map** — source of truth per concern, mutation paths, consumers (T13) |
| [`docs/architecture/CORE_CONTRACTS.md`](./docs/architecture/CORE_CONTRACTS.md) | Kernel contracts — TenantContext, RBAC, RLS, audit, outbox, idempotency, timezone |
| [`docs/architecture/DOMAIN_CONTRACTS.md`](./docs/architecture/DOMAIN_CONTRACTS.md) | Domain boundaries — org, party, catalog, inventory, sales, purchasing, accounting, CRM, reporting |
| [`docs/architecture/TAWALA_CORE_DESIGN.md`](./docs/architecture/TAWALA_CORE_DESIGN.md) | Design intent |
| [`docs/architecture/TAWALA_CORE_DEVELOPMENT_SPEC.md`](./docs/architecture/TAWALA_CORE_DEVELOPMENT_SPEC.md) | Development specification |
| [`docs/architecture/V2_CORE_MILESTONES.md`](./docs/architecture/V2_CORE_MILESTONES.md) | Milestone program |
| [`docs/architecture/CORE_COMPATIBILITY_MATRIX.md`](./docs/architecture/CORE_COMPATIBILITY_MATRIX.md) | Compatibility / gate matrix |
| [`.trackers/`](./.trackers/) | Working task / repo-state / rollback notes |

---

## 3. Architecture (summary)

### 3.1 Source of truth

| Concern | Owner | Must not own |
|---------|--------|----------------|
| Tenant / business | Organization + RLS GUCs | Clients, reporting |
| People / orgs identity | `Party` + `PartyBusinessLink` | CRM as second customer table |
| What is sold | Catalog (`Product` / `Service`) | Stock quantities |
| Stock | Inventory (`StockLevel`, `StockMovement`) | Sales line copies of qty |
| Commercial sales docs | Sales | CRM / reporting |
| Procurement docs | Purchasing | — |
| Financial truth | Accounting (journals, COA) | Ad-hoc payment rows alone |
| Customer intelligence | CRM (on Party) | Transaction ledgers |
| Analytics | Reporting (**read-only**) | Any write path |

Full table and mutation diagram: [`CORE_ARCHITECTURE_MAP.md`](./docs/architecture/CORE_ARCHITECTURE_MAP.md).

### 3.2 Request path

```text
HTTP → TenantContext + RBAC + module entitlement
     → Domain service (SQLModel AsyncSession)
     → Optional: stock / journal / outbox in same UoW
     → commit
     → Audit / DomainEvent / OutboxEntry
```

### 3.3 Milestone delivery (T-series)

Implemented on `core/v2` (board issues #267–#276 closed where applicable):

| Series | Focus |
|--------|--------|
| T1–T3 | Contracts, RLS isolation, authorization |
| T4 | Audit, outbox, idempotency |
| T5 | Capability / entitlements (`module.*`) |
| T6 | Domain contract docs |
| T7 | Inventory |
| T8 | Sales lifecycle |
| T9 | Purchasing (PO / GRN) |
| T10 | Accounting |
| T11 | CRM |
| T12 | Reporting (read models) |
| T13 | Cross-domain certification suite + architecture map |

Certification tests: `backend/tests/certification/test_cross_domain_chain.py`

---

## 4. Repository layout

```text
.
├── AGENTS.md / MERGE_POLICY.md     # Isolation & agent rules
├── Dockerfile                      # Root convenience build (copies backend/)
├── backend/
│   ├── Dockerfile                  # Canonical image (context = backend/)
│   ├── alembic/                    # Migrations (sync driver only)
│   ├── app/
│   │   ├── api/routes/             # HTTP surface
│   │   ├── core_platform/          # Domain services
│   │   ├── models/                 # SQLModel tables
│   │   ├── db/                     # Async engine, RLS GUC helpers
│   │   └── main.py                 # Lifespan: loguru + DB connectivity gate
│   ├── tests/                      # Postgres integration + certification
│   └── pyproject.toml              # Python ≥ 3.13
└── docs/architecture/              # Binding design & contracts
```

---

## 5. Configuration

Credentials **only** — the app builds DSNs (no full `DATABASE_URL` input):

| Variable | Purpose |
|----------|---------|
| `DB_HOST` | Postgres host |
| `DB_PORT` | Default `5432` |
| `DB_USER` | User |
| `DB_PASSWORD` | Password (may be empty in local/CI trust setups) |
| `DB_NAME` | Database name |
| `ENVIRONMENT` | `development` \| `test` \| `production` |
| `LOG_LEVEL` | Default `DEBUG` (loguru) |

Built URLs:

- Async app: `postgresql+asyncpg://…`
- Alembic: `postgresql+psycopg://…`

Example: [`backend/.env.example`](./backend/.env.example)

**Startup:** lifespan requires credentials and runs `SELECT 1`. If the database is unreachable, the process **refuses to start**.

---

## 6. Local development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

export ENVIRONMENT=development
export LOG_LEVEL=DEBUG
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=core_user
export DB_PASSWORD=your_password
export DB_NAME=tawala_core

alembic upgrade head
uvicorn app.main:app --reload --port 8000

curl -s http://127.0.0.1:8000/health
curl -s http://127.0.0.1:8000/ready
```

### Tests (real PostgreSQL)

```bash
cd backend
export ENVIRONMENT=test
export DB_HOST=localhost
export DB_USER=… DB_PASSWORD=… DB_NAME=…
pytest -q
```

CI workflow: [`.github/workflows/core-ci.yml`](./.github/workflows/core-ci.yml) (Postgres 16 service + credential env).

---

## 7. Docker

**Python 3.13-slim**, multi-stage, non-root user. Prefer the backend context (matches CI):

```bash
# Canonical (same as core-image.yml)
docker build -t tawala-core:local -f backend/Dockerfile backend

# From repo root (root Dockerfile re-paths COPY from backend/)
docker build -t tawala-core:local .

docker run --rm -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e DB_HOST=… -e DB_USER=… -e DB_PASSWORD=… -e DB_NAME=… \
  tawala-core:local
```

Container entry: `start.sh` → `alembic upgrade head` → `uvicorn`.

Multi-platform (`linux/amd64`, `linux/arm64`) is configured in [`.github/workflows/core-image.yml`](./.github/workflows/core-image.yml) when a Core registry is set.

---

## 8. HTTP API surface (overview)

All business routes expect authenticated tenant context and permissions (see `CORE_CONTRACTS.md`). Module gates use entitlements such as `module.sales`, `module.inventory`, `module.reporting`, etc.

| Area | Prefix (typical) | Notes |
|------|------------------|--------|
| Health | `/health`, `/ready` | Liveness / readiness |
| Identity / org / security | `/api/v1/…` | Users, businesses, RBAC, scope |
| Parties | `/api/v1/…` | Party + business links |
| Catalog | `/api/v1/…` | Products / services / categories |
| Inventory | `/api/v1/…` | Receive, issue, transfer, levels |
| Sales | `/api/v1/…` | Documents, finalize, payments |
| Purchasing | `/api/v1/…` | PO, GRN |
| Accounting | `/api/v1/…` | Journals, COA adapters |
| CRM | `/api/v1/crm/customers/{party_id}/…` | Profile, notes, purchase history |
| Reporting | `/api/v1/reporting/…` | Read-only metrics |
| Audit / config / entitlements | `/api/v1/…` | Platform support |

OpenAPI: run the app and open `/docs`.

---

## 9. Engineering conventions

| Topic | Rule |
|-------|------|
| ORM | **SQLModel** + `AsyncSession`; prefer `session.exec(select(…))` |
| Raw SQL | `session.execute(text(…))` only for GUCs / infra |
| Alembic | **Sync** driver only (`postgresql+psycopg`) |
| Time | Timezone-aware UTC (`TIMESTAMPTZ`) via `BaseMixin` |
| Tenancy | `business_id` on domain rows + RLS policies |
| Commits in services | End the DB transaction — **re-set RLS GUCs** in tests after `commit()` |
| PRs | Target **`core/v2` only**; use `Closes #n` for board issues |

---

## 10. What is intentionally out of scope

- Product POS UI and `tawala-api` deploy pipeline
- Merging this branch into `main` / `dev`
- Treating CRM or Reporting as systems of record for stock or finance
- Accepting a full `DATABASE_URL` as the primary config (credentials only)

---

## 11. Remaining non-domain work

| Item | Notes |
|------|--------|
| [#245](https://github.com/NetHub-Ltd/TawalaKE/issues/245) | GitHub branch protection on product `main` (ops) |

---

*Documentation hub for `core/v2`. Prefer linking here from PRs and onboarding; keep architecture details in `docs/architecture/`.*
