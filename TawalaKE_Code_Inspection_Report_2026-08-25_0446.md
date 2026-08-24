# TawalaKE — Full Code Inspection Report

**Generated:** 2026-08-24  
**Inspector:** Engineer Mode Agent  
**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Commit:** `b07d68a055666aae258eb5581930611db99e4c4d`  
**Branch:** `main`  
**Latest Tag:** `v0.0.36`  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Repository Metadata](#2-repository-metadata)
3. [Backend Deep Dive](#3-backend-deep-dive)
4. [Frontend Deep Dive](#4-frontend-deep-dive)
5. [Database & Migrations](#5-database--migrations)
6. [CI/CD & DevOps](#6-cicd--devops)
7. [Documentation](#7-documentation)
8. [Security Analysis](#8-security-analysis)
9. [Code Quality Assessment](#9-code-quality-assessment)
10. [Issues, Risks & Recommendations](#10-issues-risks--recommendations)
11. [Complete File Inventory](#11-complete-file-inventory)
12. [Summary](#12-summary)

---

## 1. Executive Summary

Tawala is a **Business Management System / POS platform** targeting Kenyan SMEs. It is a full-stack application with a FastAPI backend and a Next.js frontend, built around a multi-tenant architecture where Organizations own multiple Businesses (stores/branches).

### High-Level Stats

| Metric | Value |
|---|---|
| **Backend LOC** | ~8,089 lines (Python) |
| **Frontend LOC** | ~35,668 lines (TypeScript/TSX) |
| **Total Files** | 457 |
| **Frontend Pages** | 30 Next.js App Router pages |
| **Frontend Components** | 35+ React components |
| **Alembic Migrations** | 46 revision files |
| **Backend Routes** | 8 router modules (4 active, 4 disabled) |
| **Test Files** | 5 test modules |

### Architecture Pattern
- **Backend:** FastAPI + SQLModel (SQLAlchemy 2.0) + asyncpg + PostgreSQL + Redis + Celery
- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS + Zustand + React Query + Orval (OpenAPI client generation)
- **Auth:** Hybrid JWT (email/password for web) + 4-digit PIN (for staff/terminal)
- **Multi-tenancy:** Organization -> Business (store) hierarchy with schema-level or row-level isolation
- **Deployment:** Docker multi-arch (amd64/arm64) via GitHub Actions -> GHCR

### Overall Health Assessment
- **Backend:** Moderate. Core patterns are solid (CRUD base, dependency injection, async). However, significant routes are commented out, version drift exists, and test coverage is thin.
- **Frontend:** Large and feature-rich but complex. Heavy use of generated API clients, Zustand stores, and client-side state. Some files are very large (1,800+ lines) indicating potential maintainability issues.
- **DevOps:** Minimal. Only a backend build pipeline exists. No docker-compose, no frontend CI, no staging environment config.
- **Security:** Mixed. JWT with HS256, rate limiting, CORS filtering. But admin password in config, no `.env.example`, and some hardcoded values.

---

## 2. Repository Metadata

```
Repository:     NetHub-Ltd/TawalaKE
Default Branch: main
Current Commit: b07d68a055666aae258eb5581930611db99e4c4d
Latest Tag:     v0.0.36
Remote Branches:
  - origin/main
  - origin/feature-onboarding
  - origin/product-workspace
Tags (selected):
  v0.0.1 -> v0.0.36, v0.1.0 -> v0.1.13
```

### Directory Structure

```
TawalaKE/
├── .github/
│   └── workflows/
│       └── build_and_push.yml      # Backend Docker build CI
├── backend/                        # FastAPI application
│   ├── alembic/                    # Database migrations
│   │   ├── env.py
│   │   └── versions/               # 46 migration files
│   ├── app/
│   │   ├── api/
│   │   │   ├── api_router.py       # Main API router assembly
│   │   │   ├── deps.py             # FastAPI dependencies (auth, DB)
│   │   │   └── routes/             # Endpoint modules
│   │   ├── core/                   # Core infrastructure
│   │   │   ├── config.py           # Pydantic Settings
│   │   │   ├── security.py         # JWT, password hashing, PIN auth
│   │   │   ├── session.py          # SQLAlchemy engine/factory
│   │   │   ├── exceptions.py       # Custom HTTP exceptions
│   │   │   ├── redis_client.py     # Redis connection + rate limiter
│   │   │   ├── mailer.py           # Email service (Resend)
│   │   │   └── httpx.py            # HTTP client wrapper
│   │   ├── crud/                   # CRUD operations
│   │   ├── models/                 # SQLModel/SQLAlchemy models
│   │   ├── schemas/                # Pydantic schemas (DTOs)
│   │   ├── tasks/                  # Celery background tasks
│   │   ├── utils/                  # Helpers, logging, plans
│   │   ├── main.py                 # FastAPI app factory
│   │   └── prestart.py             # Admin tenant bootstrap
│   ├── testing/                    # Pytest suite
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── alembic.ini
├── frontend/                       # Next.js application
│   ├── src/
│   │   ├── app/                    # App Router pages
│   │   ├── features/               # Domain-specific modules
│   │   ├── lib/                    # Utilities, API clients, stores
│   │   └── ...
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   ├── orval.config.ts
│   └── tsconfig.json
├── docs/                           # Business/marketing docs
└── media/                          # Assets (logo, video, images)
```

---

## 3. Backend Deep Dive

### 3.1 Architecture Overview

The backend follows a layered architecture:

```
HTTP Request
    |
FastAPI Router (app/api/routes/*.py)
    |
FastAPI Dependencies (app/api/deps.py) -- auth, DB session
    |
CRUD Layer (app/crud/*.py) -- business logic + DB operations
    |
SQLModel Models (app/models/*.py) -- ORM mapping
    |
PostgreSQL (asyncpg driver)
```

Additional infrastructure:
- **Redis:** Caching (FastAPI-Cache2) + Rate Limiting (SlowAPI) + Celery broker
- **Celery:** Background task worker (`app/tasks/worker.py`)
- **Alembic:** Database migration management
- **Resend:** Transactional email delivery

---

### 3.2 Core Modules (app/core/)

#### `config.py` (80 lines)

```python
import enum

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import EmailStr


# environment enum
class Environment(str, enum.Enum):
    DEVELOPMENT = "development"
    PRODUCTION = "production"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("./.env", "./.env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
    )
    # App Config
    app_name: str
    app_version: str
    environment: Environment

    # Database Settings
    DATABASE_NAME: str
    DATABASE_USER: str
    DATABASE_HOST: str
    DATABASE_PORT: int
    DATABASE_PASSWORD: str

    # security
    secret_key: str
    algorithm: str = "HS256"
    issuer: str
    audience: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int
    pin_token_expire_hours: int

    admin_name: str
    admin_email: EmailStr
    admin_password: str

    # Management
    admin_route: bool = False

    resource_server: str
    allowed_origins: str

    # Email Configuration
    resend_api_key: str
    email_from_security: str = "NetHub Security <security@nethub.co.ke>"
    email_from_billing: str = "NetHub Billing <billing@nethub.co.ke>"
    email_from_support: str = "NetHub Support <support@nethub.co.ke>"
    email_from_tawala: str = "Tawala System <tawala@nethub.co.ke>"
    email_from_marketing: str = "NetHub Updates <newsletter@nethub.co.ke>"
    frontend_url: str = "preview.nethub.co.ke"

    redis_url: str

    @property
    def cors_origins(self) -> list:
        if not self.allowed_origins:
            return []
        # Split by comma, strip whitespace, and filter out empty strings or "*"
        return [f.strip() for f in self.allowed_origins.split(",") if f.strip() and f.strip() != "*"]

    @property
    def async_db_url(self) -> str:
        return f"postgresql+asyncpg://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
```

**Analysis:**
- Uses `pydantic-settings` with `.env` and `.env.local` files
- Defines `Environment` enum (development / production)
- Database config uses individual fields (USER, HOST, PORT, PASSWORD, NAME) rather than a single URL -- good for clarity
- JWT config: HS256 algorithm, configurable expiry times for access, refresh, and PIN tokens
- Admin credentials are **loaded from environment** (`admin_name`, `admin_email`, `admin_password`) -- acceptable if env is secure
- CORS origins parsed from comma-separated string; explicitly filters out `"*"` -- good security practice
- `admin_route` boolean flag controls whether management routes are mounted -- useful for dev/staging
- **Missing:** No validation that `secret_key` meets minimum length for HS256
- **Missing:** No `.env.example` to document required variables

---

#### `security.py` (518 lines)

**Analysis:**
- Implements **dual authentication**: JWT tokens (for web/admin) and 4-digit PIN tokens (for staff/terminal)
- Password hashing via **Argon2** (`argon2-cffi`) -- industry best practice
- PIN tokens are JWTs with a custom `pin` claim, shorter expiry (hours)
- `create_access_token` and `create_refresh_token` use `jwt.encode` with HS256
- `verify_password` and `verify_pin` use Argon2 verifier
- `get_password_hash` and `get_pin_hash` for creation
- `OAuth2PasswordBearer` is configured but the token URL points to `/api/v1/auth/login` -- correct
- `get_current_user` and `get_current_staff` dependency functions for route protection
- `get_current_active_user` checks user status
- **Concern:** The `secret_key` is used directly for JWT signing. If it's short or predictable, tokens are forgeable. No key rotation mechanism.
- **Concern:** `get_current_staff` uses a PIN token path but the logic appears to mix staff and user authentication in some places -- needs careful review
- **Concern:** No explicit token blacklisting or revocation mechanism

---

#### `session.py` (41 lines)

**Analysis:**
- Creates async SQLAlchemy engine using `create_async_engine`
- Uses `AsyncSession` with `expire_on_commit=False` -- correct for FastAPI async patterns
- `get_session()` is an async generator for dependency injection
- **Missing:** No connection pooling configuration exposed (pool size, max overflow, timeout)
- **Missing:** No engine disposal or cleanup on application shutdown

---

#### `exceptions.py` (38 lines)

**Analysis:**
- Defines custom `HTTPException` subclasses: `NotFoundError`, `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`
- Simple, clean inheritance pattern
- Used consistently across routes and CRUD layers
- **Note:** `NotFoundError` defaults to 404, `ConflictError` to 409 -- semantically correct

---

#### `redis_client.py` (65 lines)

**Analysis:**
- Wraps Redis connection with `redis.asyncio.Redis`
- Includes a `limiter` from `slowapi` for rate limiting
- `redis_manager` class with `connect()` and `disconnect()` lifecycle methods
- Used in `main.py` lifespan to initialize FastAPI-Cache2
- **Missing:** No retry logic or health check for Redis connection
- **Missing:** No fallback behavior if Redis is unavailable (cache would fail)

---

#### `mailer.py` (365 lines)

**Analysis:**
- Email service using **Resend** API
- Multiple sender personas: security, billing, support, tawala, marketing
- HTML email templates with Jinja2 rendering
- Templates for: welcome, password reset, PIN reset, invoice, receipt, subscription events
- **Concern:** Hardcoded HTML templates are large and inline -- consider external template files
- **Concern:** No email queueing (sends synchronously). High volume could block requests.
- **Concern:** No fallback if Resend API fails (no retry, no secondary provider)

---

#### `httpx.py` (7 lines)

**Analysis:**
- Minimal wrapper around `httpx.AsyncClient`
- Currently just an import/export pattern
- **Missing:** No timeout configuration, no connection pooling limits, no retry logic

---

### 3.3 API Layer (app/api/)

#### `api_router.py` (27 lines)

```python
from fastapi import APIRouter, Depends
from app.api.routes import organization, products, sales, payments,staff, auth, management, stores
from app.core.config import settings

from app.utils.logging import logger
from app.api.deps import AuthUser, get_current_staff


api_router = APIRouter(prefix='/api/v1')

if settings.admin_route:
    logger.info("Admin route is enabled. Including management routes.")
    api_router.include_router(
        management.router,
        prefix="/management",
        tags=["Management"],
        dependencies=[Depends(get_current_staff)],
    ),  # ,

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(organization.router, prefix="/organizations", tags=["Organization Management"])
api_router.include_router(stores.router, prefix="/business", tags=["Store Management"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
# api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
# api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
# api_router.include_router(checkout.router, prefix="/terminal", tags=["Checkout Pipeline"])
# api_router.include_router(staff.router, prefix="/staff", tags=["Staff Management"])
```

**Analysis:**
- Main router mounted at `/api/v1`
- **Critical Issue:** Four major routes are **commented out**:
  - `sales` -- POS sales operations
  - `payments` -- Payment processing
  - `checkout` -- Terminal checkout pipeline
  - `staff` -- Staff management
- Only **active routes:** auth, organizations, business (stores), products, management (admin-only, gated by `admin_route` flag)
- This means the backend API is currently **incomplete** -- core POS functionality is disabled
- The `management` route is conditionally included based on `settings.admin_route` -- good for security

---

#### `deps.py` (182 lines)

**Analysis:**
- FastAPI dependency functions for authentication and database sessions
- `get_session()` -- yields async SQLModel session
- `get_current_user()` -- validates JWT access token, returns user from DB
- `get_current_staff()` -- validates PIN token, returns staff member
- `AuthUser` type alias = `Union[User, Staff]`
- `get_current_active_user()` -- additional check for active status
- **Concern:** `get_current_user` does a DB lookup on every request -- acceptable for small scale, but consider caching active sessions
- **Concern:** No rate limiting applied at the dependency level
- **Concern:** `get_current_staff` may not handle expired PIN tokens gracefully (relies on JWT decode exception)

---

### 3.4 API Routes (app/api/routes/)

#### `auth.py` (233 lines)

**Analysis:**
- Authentication endpoints:
  - `POST /api/v1/auth/login` -- email/password login, returns access + refresh tokens
  - `POST /api/v1/auth/refresh` -- refresh token rotation
  - `POST /api/v1/auth/register` -- new user registration
  - `POST /api/v1/auth/forgot-password` -- password reset request
  - `POST /api/v1/auth/reset-password` -- password reset execution
  - `POST /api/v1/auth/verify-email` -- email verification
- Uses `OAuth2PasswordRequestForm` for login -- standard FastAPI pattern
- Returns `Token` schema with access_token, refresh_token, token_type
- **Concern:** Registration endpoint may not verify email uniqueness before creating user
- **Concern:** No explicit brute-force protection on login endpoint (rate limiting is global, not per-endpoint)
- **Concern:** Password reset tokens sent via email -- ensure they are single-use and time-limited

---

#### `organization.py` (133 lines)

**Analysis:**
- Organization (tenant) management endpoints
- `POST /api/v1/organizations` -- create new organization
- `GET /api/v1/organizations` -- list user's organizations
- `GET /api/v1/organizations/{id}` -- get single organization
- `PUT /api/v1/organizations/{id}` -- update organization
- `DELETE /api/v1/organizations/{id}` -- delete organization
- Uses `get_current_active_user` dependency
- **Note:** This is the top-level multi-tenant boundary

---

#### `products.py` (261 lines)

**Analysis:**
- Product catalog endpoints
- `GET /api/v1/products` -- list products (with pagination, search, filters)
- `POST /api/v1/products` -- create product
- `GET /api/v1/products/{id}` -- get product detail
- `PUT /api/v1/products/{id}` -- update product
- `DELETE /api/v1/products/{id}` -- delete product
- `GET /api/v1/products/search` -- search products
- Supports filtering by business, category, stock status
- **Concern:** No explicit authorization check that the user owns the business when accessing products
- **Concern:** Deletion may not handle related sales/transaction history (cascade behavior depends on model)

---

#### `sales.py` (74 lines) -- **COMMENTED OUT IN ROUTER**

**Analysis:**
- Sales/transaction endpoints -- **currently disabled**
- Appears to handle sale creation, listing, and retrieval
- References `checkout` and `sale` CRUD operations
- **Status:** Incomplete or intentionally held back

---

#### `payments.py` (16 lines) -- **COMMENTED OUT IN ROUTER**

**Analysis:**
- Payment processing endpoints -- **currently disabled**
- Only 16 lines -- extremely minimal, likely a stub
- **Status:** Not implemented

---

#### `staff.py` (58 lines) -- **COMMENTED OUT IN ROUTER**

**Analysis:**
- Staff management endpoints -- **currently disabled**
- Handles staff creation, listing, and PIN management
- **Status:** Incomplete or intentionally held back

---

#### `management.py` (71 lines)

**Analysis:**
- Admin-only management endpoints
- Gated by `admin_route` config flag AND `get_current_staff` dependency
- Likely used for system-wide administration
- **Concern:** The route is conditionally mounted, which is good, but the admin check should also verify role/permissions

---

#### `stores.py` (330 lines)

**Analysis:**
- Business/store management endpoints (mounted at `/api/v1/business`)
- `GET /api/v1/business` -- list businesses for an organization
- `POST /api/v1/business` -- create business
- `GET /api/v1/business/{id}` -- get business details
- `PUT /api/v1/business/{id}` -- update business
- `DELETE /api/v1/business/{id}` -- delete business
- Additional endpoints for analytics, sales history, stock operations
- **Concern:** `delete` endpoint may have cascading effects on products, sales, staff -- verify FK constraints
- **Concern:** Analytics endpoints may be computationally expensive without caching or materialized views

---

### 3.5 Models (app/models/)

#### `base.py` (45 lines)

**Analysis:**
- Base SQLModel class with common fields: `id` (UUID primary key), `created_at`, `updated_at`
- Uses `UUID` type from `sqlmodel` -- good for distributed systems
- `table=True` indicates this is an actual table, not just a schema
- **Note:** All models inherit from this base

---

#### `models.py` (860 lines)

**Analysis:**
- Core domain models:
  - `User` -- system users (owners/admins)
  - `Organization` -- top-level tenant
  - `Business` -- individual store/branch
  - `Staff` -- employees with 4-digit PINs
  - `Product` -- inventory items
  - `Sale` / `SaleItem` -- transactions
  - `Customer` -- customer records
  - `FinancialDocument` -- invoices/receipts
  - `StockHistory` / `StockBatch` -- inventory tracking
  - `Subscription` / `Plan` -- billing/subscription management
- Uses SQLModel (Pydantic + SQLAlchemy hybrid)
- Relationships defined with `Relationship()` back_populates
- **Concern:** `User` model stores `password_hash` -- ensure Argon2 parameters are strong
- **Concern:** `Staff` model has `pin_hash` -- 4-digit PINs are inherently weak; Argon2 helps but brute-force is still feasible
- **Concern:** Some models have `tenant_id` or `organization_id` -- verify multi-tenant query filtering is consistent
- **Concern:** `FinancialDocument` may store sensitive payment data -- ensure PCI-DSS considerations

---

#### `store.py` (0 lines)

**Analysis:**
- Empty file -- placeholder or dead code
- **Recommendation:** Remove or populate

---

### 3.6 Schemas (app/schemas/)

#### `schemas.py` (374 lines)

**Analysis:**
- Core Pydantic schemas for request/response validation
- `UserCreate`, `UserRead`, `UserUpdate` -- standard CRUD patterns
- `OrganizationCreate`, `OrganizationRead`, etc.
- `Token` schema for JWT responses
- `Message` schema for generic responses
- **Pattern:** Consistent use of `BaseModel` with `ConfigDict` or `model_config`
- **Note:** Some schemas use `SQLModel` base, some use `BaseModel` -- mixed pattern

---

#### `business.py` (149 lines)

**Analysis:**
- Business/store-specific schemas
- `BusinessCreate`, `BusinessRead`, `BusinessUpdate`
- `BusinessResponse` with nested data
- `BusinessAnalytics` for dashboard data
- **Concern:** `BusinessAnalytics` may be a heavy computation result -- ensure it's cached

---

#### `sale.py` (71 lines)

**Analysis:**
- Sale transaction schemas
- `SaleCreate`, `SaleRead`, `SaleItemCreate`, `SaleItemRead`
- References products, quantities, prices, discounts
- **Note:** `service_amount` is optional -- recent fix made it nullable

---

#### `store.py` (213 lines)

**Analysis:**
- Store-specific schemas including stock operations
- `StockCreate`, `StockRead`, `StockUpdate`
- `StockHistoryCreate`, `StockHistoryRead`
- `RestockRequest`, `AuditRequest`
- **Pattern:** Good separation of read vs write schemas

---

#### `staff.py` (34 lines)

**Analysis:**
- Staff member schemas
- `StaffCreate`, `StaffRead`, `StaffUpdate`
- Includes PIN and role fields
- **Concern:** `StaffCreate` may accept plain PIN -- ensure it's hashed before storage

---

#### `org.py` (21 lines)

**Analysis:**
- Minimal organization schemas
- `OrgCreate`, `OrgRead`
- **Note:** Very short file -- may be incomplete

---

#### `plans.py` (200 lines)

**Analysis:**
- Subscription and billing plan schemas
- `PlanCreate`, `PlanRead`, `PlanUpdate`
- `SubscriptionCreate`, `SubscriptionRead`
- `BillingCycle`, `PaymentStatus` enums
- **Concern:** Payment-related schemas may need additional validation (e.g., amount > 0)

---

#### `enums.py` (93 lines)

**Analysis:**
- Centralized enum definitions
- `UserRole`, `StaffRole`, `ProductType`, `SaleStatus`, `PaymentMethod`, `DocumentType`, `StockMovementType`
- **Pattern:** Good practice to centralize enums
- **Note:** Some enums may be duplicated in models -- verify consistency

---

#### `analytics.py` (35 lines)

**Analysis:**
- Analytics response schemas
- `AnalyticsSummary`, `AnalyticsSeriesPoint`, `AnalyticsPeriod`
- **Note:** Lightweight schemas for dashboard data

---

### 3.7 CRUD Layer (app/crud/)

#### `base.py` (319 lines)

**Analysis:**
- Generic CRUD base class using generics and SQLModel
- `CRUDBase[ModelType, CreateSchemaType, UpdateSchemaType]`
- Methods: `get`, `get_multi`, `create`, `update`, `delete`, `count`
- Uses `AsyncSession` for all operations
- `get_multi` supports pagination (`skip`, `limit`) and optional filters
- **Pattern:** Solid, type-safe generic CRUD pattern
- **Concern:** `delete()` uses `session.delete()` directly -- no soft-delete mechanism
- **Concern:** No audit logging on CRUD operations
- **Concern:** `update()` does `obj_data = jsonable_encoder(db_obj)` then updates -- this can be inefficient for large objects

---

#### `store.py` (897 lines)

**Analysis:**
- Largest CRUD module -- handles business/store operations, stock, sales, analytics
- `CRUDStore` extends `CRUDBase` with business-specific methods
- Methods for: stock management, restocking, auditing, sales processing, analytics aggregation
- **Concern:** 897 lines is very large -- consider splitting into smaller modules (stock_crud.py, sale_crud.py, analytics_crud.py)
- **Concern:** Analytics methods may perform heavy SQL aggregations -- verify indexing on date/timestamp columns
- **Concern:** Stock operations should be atomic (use transactions) -- verify `session.commit()` placement

---

#### `sale.py` (295 lines)

**Analysis:**
- Sale transaction CRUD operations
- `CRUDSale` with methods for creating sales, retrieving history, generating receipts
- **Concern:** Sale creation may involve multiple models (Sale, SaleItem, StockHistory) -- ensure transactional integrity
- **Concern:** Receipt generation logic may be duplicated between backend and frontend

---

#### `product.py` (176 lines)

**Analysis:**
- Product catalog CRUD
- `CRUDProduct` with search, filtering, and stock-level methods
- **Pattern:** Clean extension of base CRUD

---

#### `organization.py` (126 lines)

**Analysis:**
- Organization (tenant) CRUD
- `CRUDOrganization` with user association
- **Concern:** Deleting an organization should cascade to businesses, products, sales -- verify FK behavior

---

#### `business.py` (155 lines)

**Analysis:**
- Business (store) CRUD
- `CRUDBusiness` with organization linkage
- **Pattern:** Standard CRUD with org filtering

---

#### `staff.py` (48 lines)

**Analysis:**
- Staff member CRUD
- `CRUDStaff` with PIN management
- **Concern:** PIN updates should re-hash the PIN -- verify this happens in the route layer

---

#### `checkout.py` (47 lines)

**Analysis:**
- Checkout/terminal CRUD
- `CRUDCheckout` -- minimal implementation
- **Status:** Likely incomplete

---

### 3.8 Utilities (app/utils/)

#### `helpers.py` (155 lines)

**Analysis:**
- Helper functions: `utc_now()`, `generate_receipt_number()`, `format_currency()`, `generate_pin()`
- `generate_pin()` creates random 4-digit PINs -- acceptable for terminal use but document security implications
- `format_currency()` uses Kenyan Shilling (KSh) formatting
- **Pattern:** Clean, focused utility module

---

#### `logging.py` (270 lines)

**Analysis:**
- Logging configuration using `loguru`
- Custom formatter with colorized output for development
- File logging for production
- **Concern:** Log files may grow unbounded -- no rotation config visible
- **Concern:** Sensitive data (passwords, PINs, tokens) could be logged if not careful -- verify no PII in logs

---

#### `plans.py` (150 lines)

**Analysis:**
- Plan/pricing logic
- `PlanManager` with plan definitions (Basic, Ndovu, Enterprise)
- Pricing in KSh: 999, 1,999, 3,999+
- Feature flags per plan
- **Pattern:** Good abstraction for subscription tiers

---

### 3.9 Tasks (app/tasks/)

#### `worker.py` (274 lines)

**Analysis:**
- Celery worker configuration
- Task definitions for: email sending, report generation, subscription reminders
- Uses `celery` with Redis as broker
- **Concern:** Celery worker is configured but may not be running in production -- verify deployment
- **Concern:** No task result backend configured (or not visible)
- **Concern:** Tasks that send emails should have retry logic with exponential backoff

---

### 3.10 Application Entry Points

#### `main.py` (384 lines)

**Analysis:**
- FastAPI application factory with lifespan context manager
- Lifespan handles:
  1. Database connectivity check (`SELECT 1`)
  2. Admin tenant creation (`prestart.py`)
  3. Redis cache initialization (`FastAPICache`)
  4. Rate limiter setup (`SlowAPI`)
- CORS middleware with origin filtering
- Rate limit exceeded handler
- API router mounted at `/api/v1`
- Health check endpoint at `/health`
- **Concern:** The file has a large commented block at the top (appears to be an older version of the same code) -- dead code, should be removed
- **Concern:** `_PRIVATE_NETWORKS` list filters private IPs for some purpose -- verify this is intentional and documented
- **Concern:** No structured logging middleware (request ID, response time, status code)

---

#### `prestart.py` (199 lines)

**Analysis:**
- Bootstrap script run during application startup
- Creates admin tenant/organization if it doesn't exist
- Uses environment variables for admin credentials
- **Concern:** `create_admin_tenant()` runs on every startup -- should be idempotent (appears to be)
- **Concern:** Admin password is loaded from env but may be logged or exposed in error traces

---

### 3.11 Tests (testing/)

#### `conftest.py` (143 lines)

**Analysis:**
- Pytest configuration with async support (`pytest-asyncio`)
- `AsyncClient` fixture for HTTP testing
- `Session` fixture for DB testing
- `fakeredis` used for Redis mocking
- **Pattern:** Good test infrastructure setup

---

#### `test_crudbase.py` (250 lines)

**Analysis:**
- Tests for the generic CRUD base class
- Covers create, read, update, delete, count operations
- Uses async fixtures
- **Pattern:** Comprehensive base CRUD testing

---

#### `test_main.py` (50 lines)

**Analysis:**
- Basic application startup tests
- Health check endpoint test
- **Concern:** Only 50 lines -- very minimal coverage of main.py

---

#### `test_product_crud.py` (215 lines)

**Analysis:**
- Product CRUD operation tests
- Covers create, read, update, delete, search
- **Pattern:** Good domain-specific CRUD testing

---

#### `test_store_crud.py` (639 lines)

**Analysis:**
- Store/business CRUD tests -- largest test file
- Covers business creation, stock operations, sales, analytics
- **Pattern:** Comprehensive but may be testing too many concerns in one file
- **Concern:** 639 lines is large -- consider splitting by concern

---

## 4. Frontend Deep Dive

### 4.1 Architecture Overview

The frontend is a **Next.js 16** application using the **App Router** pattern. It follows a feature-based directory structure.

```
HTTP Request
    |
Next.js App Router (src/app/)
    |
API Route Handlers (src/app/api/v1/...) -- server-side proxy to backend
    |
Orval-Generated API Client (src/lib/api/generated/)
    |
React Query / Zustand (state management)
    |
Feature Components (src/features/)
    |
UI Components (src/lib/components/ui/)
```

Key technologies:
- **Next.js 16** with App Router
- **React 19** with Server Components + Client Components
- **Tailwind CSS** for styling
- **Zustand** for global state (cart, tenant)
- **React Query (TanStack)** for server state
- **Orval** for OpenAPI-to-TypeScript client generation
- **React Hook Form + Zod** for form validation
- **NextAuth.js v5** for authentication
- **Framer Motion** for animations
- **html2canvas + jsPDF** for receipt PDF generation

---

### 4.2 Configuration Files

#### `package.json`

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "generate-api": "orval --config ./orval.config.ts"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@tanstack/react-query": "^5.100.9",
    "axios": "^1.15.2",
    "babel-plugin-react-compiler": "^1.0.0",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "framer-motion": "^12.43.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.1",
    "jwt-decode": "^4.0.0",
    "lucide-react": "^1.14.0",
    "next": "^16.2.11",
    "next-auth": "^5.0.0-beta.32",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-hook-form": "^7.75.0",
    "react-qr-code": "^2.2.0",
    "sharp": "^0.35.3",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.6.0",
    "zod": "^4.4.3",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.3.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.3",
    "openapi-zod-client": "^1.18.3",
    "orval": "^8.22.0",
    "postcss": "^8.5.22",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

**Analysis:**
- Next.js 16.2.11, React 19.2.4 -- very modern, cutting-edge versions
- Uses `babel-plugin-react-compiler` -- React 19's new compiler for automatic memoization
- `next-auth` v5 beta -- still in beta, may have breaking changes
- `orval` for API client generation from OpenAPI spec
- `zod` v4 for schema validation
- `zustand` v5 for state management
- `tailwindcss` v4 -- also cutting-edge
- **Concern:** Multiple packages at major version 0 or beta -- stability risk
- **Concern:** `lucide-react` version `^1.14.0` is very old compared to other packages -- may have compatibility issues

---

#### `next.config.ts`

**Analysis:**
- TypeScript config for Next.js
- `images.unoptimized: true` -- disables Next.js image optimization (likely for static export or Docker compatibility)
- **Missing:** No explicit `output: 'standalone'` for Docker deployment
- **Missing:** No rewrites or redirects configuration

---

#### `orval.config.ts`

**Analysis:**
- Orval configuration for generating TypeScript API clients from OpenAPI spec
- Output directory: `src/lib/api/generated/`
- Uses `zod` for validation schemas
- **Concern:** The input spec URL or file is not visible in this config -- may be fetched from backend at build time
- **Concern:** Generated files are committed to git (47,781 lines for checkout-pipeline alone) -- should be .gitignored and generated at build time

---

#### `auth.ts`

**Analysis:**
- NextAuth.js v5 configuration
- Credentials provider for email/password login
- JWT session strategy
- Custom `authorize` callback that calls the backend login API
- **Concern:** The `authorize` callback makes a direct HTTP request to the backend -- ensure this uses the internal Docker network in production, not public internet
- **Concern:** JWT secret is from `AUTH_SECRET` env var -- must be strong and rotated
- **Concern:** No explicit session expiry handling beyond JWT defaults

---

### 4.3 API Layer

#### `src/lib/axiosClient.ts` (9 lines)

**Analysis:**
- Minimal Axios instance wrapper
- Base URL from environment
- **Missing:** No interceptors for auth token injection, error handling, or retry logic
- **Missing:** No request/response logging

---

#### `src/lib/api/fetcher.ts` (17 lines)

**Analysis:**
- Simple fetch wrapper for React Query
- **Pattern:** Standard SWR/fetcher pattern
- **Missing:** No error handling or status code checks

---

#### `src/proxy.ts` (143 lines)

**Analysis:**
- Server-side proxy utility for API calls from Next.js server components/route handlers
- Handles cookie forwarding for authentication
- **Pattern:** Good abstraction for server-to-backend communication
- **Concern:** Error handling is basic -- may expose backend errors directly

---

#### Generated API Client: `src/lib/api/generated/business/business.ts` (717 lines)

**Analysis:**
- Auto-generated from OpenAPI spec via Orval
- Type-safe API functions with React Query hooks
- `getBusiness`, `postBusiness`, etc. with proper typing
- **Concern:** 717 lines for one module -- generated code is verbose
- **Concern:** All generated files are committed to git -- should be generated at build time

---

#### Generated API Client: `src/lib/api/generated/checkout-pipeline/checkout-pipeline.ts` (1,847 lines)

**Analysis:**
- Largest generated file: 1,847 lines
- Checkout/terminal API operations
- **Concern:** This file references backend routes that are **commented out** in `api_router.py` -- the frontend expects endpoints that don't exist
- **Critical Issue:** Frontend and backend are out of sync -- frontend has generated clients for disabled routes

---

### 4.4 State Management

#### `src/lib/store/useTenantStore.ts` (26 lines)

**Analysis:**
- Zustand store for tenant/organization state
- Stores `organizationId` and `businessId`
- **Pattern:** Simple, effective global state
- **Concern:** No persistence -- tenant selection is lost on page refresh (may be handled by URL params)

---

#### `src/lib/store/useCartStore.ts` (290 lines)

**Analysis:**
- Zustand store for shopping cart state
- Methods: add item, remove item, update quantity, clear cart, calculate totals
- **Pattern:** Good separation of cart logic
- **Concern:** No persistence -- cart is lost on refresh (may be intentional for POS)

---

#### `src/features/sales/stores/useCartStore.ts` (702 lines)

**Analysis:**
- Feature-specific cart store (separate from lib store)
- More complex: handles discounts, service fees, tax calculations
- 702 lines -- quite large for a store
- **Concern:** Duplicated cart logic between `src/lib/store/useCartStore.ts` and this file -- consolidate
- **Concern:** Complex calculation logic in a store -- consider moving to a utility/service

---

### 4.5 Feature Components

#### `src/features/auth/components/LoginForm.tsx` (642 lines)

**Analysis:**
- Login form component
- Uses React Hook Form + Zod for validation
- Supports both email/password and PIN login modes
- 642 lines -- large for a form component
- **Concern:** Mixed concerns: form logic, auth logic, UI rendering, error handling -- consider splitting
- **Concern:** PIN login mode may not be fully wired to the backend (staff routes are disabled)

---

#### `src/features/org/components/Sidebar.tsx` (562 lines)

**Analysis:**
- Organization sidebar navigation
- Dynamic links based on user permissions and business state
- 562 lines -- large component
- **Concern:** Navigation logic is embedded in the component -- extract to a config/hook
- **Concern:** Partial hydration issues mentioned in recent commit -- may cause flickering

---

#### `src/features/business/components/TerminalCockpit.tsx` (1,723 lines)

**Analysis:**
- Terminal/POS cockpit -- the main sales interface
- 1,723 lines -- extremely large component
- Handles: product search, cart management, checkout flow, payment, receipt
- **Critical Concern:** This is a "god component" -- does too much. Should be split into:
  - ProductSearch component
  - CartPanel component
  - CheckoutModal component
  - ReceiptViewer component
- **Concern:** 1,723 lines will be difficult to maintain, test, and review
- **Concern:** Likely mixes server and client logic -- verify 'use client' directives

---

#### `src/features/sales/components/CartSideBar.tsx` (1,855 lines)

**Analysis:**
- Cart sidebar component
- 1,855 lines -- even larger than TerminalCockpit
- Handles: cart display, item editing, discount application, checkout initiation, receipt preview
- **Critical Concern:** Another "god component" -- needs significant decomposition
- **Concern:** Receipt generation uses `html2canvas` + `jsPDF` -- client-side PDF generation can be unreliable across browsers
- **Concern:** No loading states or optimistic updates visible

---

#### `src/features/sales/components/ReceiptClientView.tsx` (639 lines)

**Analysis:**
- Receipt display component
- 639 lines
- Handles: receipt formatting, print styling, PDF generation
- **Pattern:** Separates receipt UI from cart logic -- good
- **Concern:** PDF generation logic duplicated with CartSideBar -- consolidate into a service

---

### 4.6 Route Handlers (API Proxy)

#### `src/app/api/v1/business/route.ts` (150 lines)

**Analysis:**
- Next.js Route Handler for business API proxy
- Forwards requests to backend with auth cookies
- **Pattern:** Good server-side proxy pattern -- keeps backend URL hidden from client
- **Concern:** No request validation before forwarding
- **Concern:** Error responses are passed through directly -- may leak backend details

---

#### `src/app/api/v1/products/route.ts` (180 lines)

**Analysis:**
- Product API proxy route
- Similar pattern to business proxy
- **Pattern:** Consistent proxy implementation

---

### 4.7 Pages

#### `src/app/(organization)/org/[organizationId]/[businessId]/cart/page.tsx` (516 lines)

**Analysis:**
- Cart page for the POS terminal
- 516 lines
- Uses dynamic route params for org and business IDs
- **Pattern:** Good use of App Router dynamic segments
- **Concern:** Page component is large -- consider extracting sub-components

---

## 5. Database & Migrations

#### `alembic.ini` (149 lines)
- Standard Alembic configuration
- `sqlalchemy.url` from env variable

#### `alembic/env.py` (85 lines)
- Async Alembic environment
- Uses `sqlmodel` metadata

#### Migrations (46 files in `alembic/versions/`)
- Latest: `ffed9fe9e517_changed_stockhistory_movementtype_.py` (33 lines)
- Largest: `1cd7948300ae_database_make_over_to_support_compliace_.py` (866 lines)
- **Pattern:** Migrations are additive; no destructive changes observed in recent history
- **Issues:** Forward-only migrations; rollback requires explicit downgrades

---

## 6. CI/CD & DevOps

#### `.github/workflows/build_and_push.yml` (22 lines)

```yaml
name: Build & Push Backend to GHCR

on:
  push:
    branches: [main, master]
    tags: ["v*"]
    paths:
      - "backend/**"
  pull_request:
    paths:
      - "backend/**"

jobs:
  build-backend:
    uses: daviekaranja/workflows/.github/workflows/build_and_push_v2.yaml@master
    with:
      image_name: tawala-api
      registry: ghcr.io
      context: backend # <- Important
      push: ${{ github.event_name != 'pull_request' }}
      platforms: "linux/amd64,linux/arm64"
    secrets: inherit
```

**Analysis:**
- Triggers on push to `main`/`master` and tags `v*`
- Only when `backend/**` changes
- Uses reusable workflow from external repository
- Image: `ghcr.io/NetHub-Ltd/tawala-api`
- Multi-platform: `linux/amd64,linux/arm64`

#### `backend/Dockerfile` (43 lines)

```dockerfile
FROM python:3.12-slim

# Environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    UV_PROJECT_ENVIRONMENT=system

WORKDIR /app

# System dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
        curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

ENV PATH="/root/.local/bin:${PATH}"

# Install Python dependencies
COPY pyproject.toml uv.lock ./

RUN uv sync \
    --frozen \
    --no-install-project \
    --no-dev

# Copy application
COPY app/ ./app
COPY alembic ./alembic
COPY alembic.ini ./
COPY entrypoint.sh ./

RUN chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
```

**Analysis:**
- Python 3.12 slim base
- Installs `gcc`, `libpq-dev`, `curl`
- Uses `uv` for dependency management
- Copies `app/`, `alembic/`, `alembic.ini`, `entrypoint.sh`
- Exposes port 8000
- Entrypoint runs migrations then starts FastAPI

#### `backend/entrypoint.sh` (8 lines)

```bash
#!/bin/bash
set -e

echo "Running database migrations..."
uv run alembic upgrade head

echo "Starting Application..."
exec uv run fastapi run --host 0.0.0.0 --port 8000
```

#### `backend/pyproject.toml` (102 lines)
- Project version: `v0.0.12`
- **VERSION DRIFT:** Git tag is `v0.0.36` but pyproject says `v0.0.12`

#### `backend/tawala.yaml` (0 lines)
- Empty file -- dead code

#### `backend/app/config.txt` (38 lines)
- Unknown purpose -- appears to be a text file, not code

**DevOps Issues:**
- No `docker-compose.yml` for local orchestration
- No frontend CI/CD pipeline
- No staging environment configuration
- No Kubernetes manifests or deployment configs
- No health check or readiness probe endpoints beyond basic `/health`
- No monitoring/observability configuration (no Prometheus, no structured logging)

---

## 7. Documentation (`docs/`)

| File | Lines | Content |
|---|---|---|
| `tawala.md` | 175 | Product overview and features |
| `billing.md` | 187 | Billing and subscription docs |
| `Marketing.md` | 177 | Marketing copy and positioning |
| `privacy-policy.md` | 170 | Privacy policy |
| `terms-of-service.md` | 131 | Terms of service |
| `data-policy.md` | 98 | Data handling policy |
| `signup.md` | 8 | Minimal signup notes |

**Issues:** No API documentation (no auto-generated OpenAPI docs served); no developer setup guide; no architecture decision records (ADRs).

---

## 8. Security Analysis

### Strengths
- Argon2 for password/PIN hashing
- CORS origin filtering (explicitly blocks `"*"`)
- Rate limiting via SlowAPI
- JWT with configurable expiry
- Admin routes gated by config flag
- No secrets committed to source code (loaded from env)

### Weaknesses

| Issue | Severity | Location |
|---|---|---|
| No `.env.example` -- env vars undocumented | Medium | Repository root |
| Admin password loaded from env but may appear in traces | Medium | `config.py`, `prestart.py` |
| 4-digit PINs are inherently weak | Medium | `models.py`, `security.py` |
| No token blacklisting/revocation | Medium | `security.py` |
| No brute-force protection per endpoint | Medium | `auth.py` |
| `secret_key` length not validated | Low | `config.py` |
| No explicit authorization checks on some routes | Medium | `products.py`, `stores.py` |
| `_PRIVATE_NETWORKS` IP filtering -- purpose unclear | Low | `main.py` |
| Frontend generated clients for disabled backend routes | High | Frontend API layer |
| `FinancialDocument` may store payment data -- PCI scope | Medium | `models.py` |
| Loguru may log PII without filtering | Medium | `logging.py` |

---

## 9. Code Quality Assessment

### Backend

| Aspect | Grade | Notes |
|---|---|---|
| Type Safety | B+ | SQLModel + Pydantic generics used well |
| Test Coverage | C | Only 5 test files; many routes untested |
| Documentation | D | No docstrings on most functions; no API docs |
| Error Handling | B | Custom exceptions used consistently |
| Async Patterns | A | Proper async/await throughout |
| Dead Code | C | `store.py` empty, `main.py` commented block, `tawala.yaml` empty |
| File Size | C | `store.py` CRUD is 897 lines; `models.py` is 860 lines |

### Frontend

| Aspect | Grade | Notes |
|---|---|---|
| Type Safety | B | TypeScript used; some `any` types likely |
| Component Size | D | Multiple files >1,500 lines |
| State Management | B | Zustand + React Query pattern is good |
| API Client | B | Orval generation is good but committed to git |
| Code Duplication | C | Cart logic duplicated; PDF logic duplicated |
| Test Coverage | F | No test files visible in frontend |

### DevOps

| Aspect | Grade | Notes |
|---|---|---|
| CI/CD | C | Only backend build; no frontend CI |
| Local Dev | D | No docker-compose; no .env.example |
| Deployment Config | F | No K8s, no staging, no infra-as-code |
| Observability | F | No metrics, no structured logging, no tracing |

---

## 10. Issues, Risks & Recommendations

### Critical (Fix Immediately)
1. **Backend-Frontend Sync:** Four core backend routes (`sales`, `payments`, `checkout`, `staff`) are commented out, but the frontend has full generated API clients for them. This will cause runtime errors.
2. **"God Components":** `TerminalCockpit.tsx` (1,723 lines) and `CartSideBar.tsx` (1,855 lines) must be decomposed.
3. **Version Drift:** `pyproject.toml` says `v0.0.12` but git tag is `v0.0.36`. CI may build images with wrong version labels.

### High Priority
4. **Create `.env.example`:** Document all required environment variables.
5. **Create `docker-compose.yml`:** Enable one-command local development.
6. **Add Frontend CI:** Build, lint, and type-check the frontend on PR.
7. **Split `store.py` CRUD:** 897 lines is unmaintainable.
8. **Remove Dead Code:** Empty `store.py`, `tawala.yaml`, commented block in `main.py`.

### Medium Priority
9. **Add API Documentation:** Serve auto-generated OpenAPI docs at `/docs`.
10. **Improve Test Coverage:** Add auth route tests, integration tests, frontend tests.
11. **Add Log Rotation:** Prevent unbounded log growth.
12. **Validate `secret_key` Length:** Ensure HS256 key is sufficiently long.
13. **Add Request Logging Middleware:** Structured logs with request ID, timing, status.
14. **Consolidate Cart Stores:** Remove duplication between `lib/store/useCartStore.ts` and `features/sales/stores/useCartStore.ts`.
15. **Gitignore Generated API Clients:** Regenerate at build time instead of committing.

### Low Priority
16. **Add ADRs:** Document architecture decisions.
17. **Add Pre-commit Hooks:** Black, Ruff, ESLint, Prettier.
18. **Consider React Compiler:** Already enabled via babel plugin -- monitor for issues.
19. **Evaluate NextAuth v5 Beta:** Consider downgrading to stable v4 if beta issues arise.

---

## 11. Complete File Inventory

### Backend (`backend/app/`)

| File | Lines | Type |
|---|---|---|
| `main.py` | 384 | Entry point |
| `prestart.py` | 199 | Bootstrap |
| `api/api_router.py` | 27 | Router assembly |
| `api/deps.py` | 182 | Dependencies |
| `api/routes/auth.py` | 233 | Routes |
| `api/routes/organization.py` | 133 | Routes |
| `api/routes/products.py` | 261 | Routes |
| `api/routes/sales.py` | 74 | Routes (disabled) |
| `api/routes/payments.py` | 16 | Routes (disabled) |
| `api/routes/staff.py` | 58 | Routes (disabled) |
| `api/routes/management.py` | 71 | Routes (admin) |
| `api/routes/stores.py` | 330 | Routes |
| `core/config.py` | 80 | Config |
| `core/security.py` | 518 | Security |
| `core/session.py` | 41 | Database |
| `core/exceptions.py` | 38 | Exceptions |
| `core/redis_client.py` | 65 | Redis |
| `core/mailer.py` | 365 | Email |
| `core/httpx.py` | 7 | HTTP client |
| `models/base.py` | 45 | Model |
| `models/models.py` | 860 | Model |
| `models/store.py` | 0 | Model (empty) |
| `schemas/schemas.py` | 374 | Schema |
| `schemas/business.py` | 149 | Schema |
| `schemas/sale.py` | 71 | Schema |
| `schemas/store.py` | 213 | Schema |
| `schemas/staff.py` | 34 | Schema |
| `schemas/org.py` | 21 | Schema |
| `schemas/plans.py` | 200 | Schema |
| `schemas/enums.py` | 93 | Schema |
| `schemas/analytics.py` | 35 | Schema |
| `crud/base.py` | 319 | CRUD |
| `crud/store.py` | 897 | CRUD |
| `crud/sale.py` | 295 | CRUD |
| `crud/product.py` | 176 | CRUD |
| `crud/organization.py` | 126 | CRUD |
| `crud/business.py` | 155 | CRUD |
| `crud/staff.py` | 48 | CRUD |
| `crud/checkout.py` | 47 | CRUD |
| `utils/helpers.py` | 155 | Utility |
| `utils/logging.py` | 270 | Utility |
| `utils/plans.py` | 150 | Utility |
| `tasks/worker.py` | 274 | Celery |
| `testing/conftest.py` | 143 | Test |
| `testing/test_crudbase.py` | 250 | Test |
| `testing/test_main.py` | 50 | Test |
| `testing/test_product_crud.py` | 215 | Test |
| `testing/test_store_crud.py` | 639 | Test |

### Frontend (`frontend/src/`)

| File | Lines | Type |
|---|---|---|
| `auth.ts` | ~600 | NextAuth config |
| `proxy.ts` | 143 | Server proxy |
| `lib/axiosClient.ts` | 9 | HTTP client |
| `lib/providers.tsx` | 25 | Providers |
| `lib/api/fetcher.ts` | 17 | Fetch wrapper |
| `lib/api/generated/index.ts` | 0 | Generated index |
| `lib/api/generated/business/business.ts` | 717 | Generated client |
| `lib/api/generated/sales/sales.ts` | 157 | Generated client |
| `lib/api/generated/payments/payments.ts` | 262 | Generated client |
| `lib/api/generated/staff-management/staff-management.ts` | 108 | Generated client |
| `lib/api/generated/checkout-pipeline/checkout-pipeline.ts` | 1,847 | Generated client |
| `lib/api/generated/zod/nethubPOSMVP.ts` | 768 | Generated Zod schemas |
| `lib/store/useTenantStore.ts` | 26 | Zustand store |
| `lib/store/useCartStore.ts` | 290 | Zustand store |
| `features/auth/components/LoginForm.tsx` | 642 | Component |
| `features/org/components/Sidebar.tsx` | 562 | Component |
| `features/sales/stores/useCartStore.ts` | 702 | Zustand store |
| `features/sales/components/CartSideBar.tsx` | 1,855 | Component |
| `features/sales/components/CheckoutForm.tsx` | 245 | Component |
| `features/sales/components/ReceiptClientView.tsx` | 639 | Component |
| `features/business/components/TerminalCockpit.tsx` | 1,723 | Component |
| `features/inventory/AuditWorkspace.tsx` | 759 | Component |
| `features/stock/RestockFormWrapper.tsx` | 779 | Component |
| `app/(organization)/org/[organizationId]/[businessId]/cart/page.tsx` | 516 | Page |
| `app/api/v1/business/route.ts` | 150 | API route |
| `app/api/v1/products/route.ts` | 180 | API route |
| `app/api/v1/org/route.ts` | 35 | API route |

### Config & DevOps

| File | Lines | Purpose |
|---|---|---|
| `backend/pyproject.toml` | 102 | Python project config |
| `backend/requirements.txt` | 94 | Dependencies |
| `backend/Dockerfile` | 43 | Backend image |
| `backend/entrypoint.sh` | 8 | Container entrypoint |
| `backend/alembic.ini` | 149 | Migration config |
| `frontend/package.json` | 58 | Node project config |
| `frontend/next.config.ts` | 60 | Next.js config |
| `frontend/orval.config.ts` | 37 | API generation config |
| `frontend/tsconfig.json` | 35 | TypeScript config |
| `.github/workflows/build_and_push.yml` | 22 | CI pipeline |

---

## 12. Summary

TawalaKE is a **functionally ambitious** POS and business management platform with a modern tech stack. The backend demonstrates solid architectural patterns (generic CRUD, async SQLModel, dependency injection), and the frontend is feature-rich with generated type-safe API clients.

However, the codebase has **significant structural issues** that need attention:

1. **Backend-frontend desynchronization** -- core POS routes are disabled in the backend but fully expected by the frontend
2. **Massive frontend components** -- two files exceed 1,700 lines, making maintenance and testing extremely difficult
3. **Missing DevOps infrastructure** -- no docker-compose, no frontend CI, no `.env.example`, no deployment configs
4. **Version drift** -- `pyproject.toml` and git tags are out of sync
5. **Thin test coverage** -- especially for auth routes and the frontend
6. **Dead code** -- empty files and large commented blocks

**Recommendation:** Before adding new features, prioritize:
1. Re-enabling or fully removing the disabled backend routes (sales, payments, checkout, staff)
2. Decomposing the "god components" in the frontend
3. Creating `.env.example` and `docker-compose.yml`
4. Aligning version numbers across the codebase
5. Adding frontend CI/CD and improving test coverage

---

*End of Report*
