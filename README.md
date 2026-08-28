# Tawala

**Tawala biashara yako.**  
*Take control of your business.*

---

## About Tawala

Tawala is a modern **Business Management System** designed for Kenyan SMEs. It helps shop owners, minimarts, pharmacies, hardware stores, salons, restaurants, and other small businesses move from manual record-keeping (exercise books, calculators, and WhatsApp) to organized, efficient, and profitable operations.

Tawala is **more than a POS** — it is a complete business management platform that brings clarity, control, and accountability to your biashara.

---

## 🚀 Vision

To become the go-to business operating system for Kenyan SMEs by providing simple, powerful, and affordable tools that deliver real control over:

- Sales & Transactions
- Inventory & Stock
- Staff Accountability
- Invoicing & Receipts
- Business Insights

**From hustle to structure.**

---

## Core Features

- **Multi-Business Support** — One organization can manage multiple shops or branches
- **Staff Management** — Secure 4-digit PIN login for daily operations + role-based access
- **Sales & POS** — Fast, reliable point of sale built for speed at the counter
- **Invoicing & Receipts** — Professional invoices and printable receipts
- **Inventory Management** — Real-time stock tracking with low-stock alerts
- **Customer Management** — Store customers and track credit balances
- **Reports & Analytics** — Clear sales, profit, and performance reports
- **Expense Tracking** — Monitor business expenses

---

## Pricing Plans

| Plan | Monthly Price | Best For |
| :--- | :--- | :--- |
| **Basic** | **KSh 1,490** | Single small shops |
| **Ndovu** | **KSh 2,499** | Growing businesses (Recommended) |
| **Enterprise** | **KSh 8,990** | Multi-branch operations (finite capacity) |

**7-day trial** on Basic/Ndovu; **14-day** trial window on Enterprise. See [docs/billing.md](docs/billing.md) for limits and feature matrix.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python 3.12) + SQLModel + asyncpg
- **Database**: PostgreSQL with Alembic migrations
- **Cache & Queue**: Redis + Celery
- **Authentication**: Hybrid JWT (email/password) + 4-digit PIN (staff/terminal)
- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS v4
- **State**: Zustand (client) + React Query (server)
- **API Client**: Orval (OpenAPI -> TypeScript)
- **Email**: Resend
- **Deployment**: Docker multi-arch (amd64/arm64) via GitHub Actions -> GHCR

---

## 🏗️ Project Structure

```text
tawala/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── core/             # security, config, dependencies
│   │   ├── api/              # routers (auth, org, products, stores)
│   │   ├── models/           # SQLAlchemy/SQLModel models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── crud/             # CRUD operations
│   │   ├── utils/            # helpers, logging, plans
│   │   └── tasks/            # Celery background tasks
│   ├── testing/              # Pytest suite
│   ├── alembic/              # Database migrations
│   ├── Dockerfile
│   └── main.py
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/              # App Router pages + API proxies
│   │   ├── features/         # Domain modules (auth, sales, stock, org)
│   │   └── lib/              # API clients, stores, utilities
│   ├── public/
│   └── package.json
├── docs/                     # Business/marketing docs
└── media/                    # Assets
```

---

## 📊 Current Project State

> **Version:** Git tag `v0.0.36` | `pyproject.toml` `v0.0.12` *(drift noted)*  
> **Commit:** `b07d68a` on `main`  
> **Backend LOC:** ~8,089 Python | **Frontend LOC:** ~35,668 TypeScript/TSX  
> **Migrations:** 46 Alembic revisions | **Tests:** 5 backend test modules

### Active Backend Routes
| Route | Status | Notes |
| :--- | :--- | :--- |
| `/api/v1/auth` | ✅ Active | Login, register, refresh, password reset |
| `/api/v1/organizations` | ✅ Active | Organization (tenant) CRUD |
| `/api/v1/business` | ✅ Active | Store management + analytics |
| `/api/v1/products` | ✅ Active | Product catalog + search |
| `/api/v1/management` | ✅ Gated | Admin-only (enabled via `admin_route` env) |

### Disabled Backend Routes
| Route | Status | Notes |
| :--- | :--- | :--- |
| `/api/v1/sales` | ❌ Commented out | Sale transactions disabled |
| `/api/v1/payments` | ❌ Commented out | Payment processing stub |
| `/api/v1/terminal` | ❌ Commented out | Checkout pipeline disabled |
| `/api/v1/staff` | ❌ Commented out | Staff management disabled |

> ⚠️ **Frontend-Backend Sync Issue:** The frontend has fully generated API clients for the disabled routes above. This will cause runtime errors when those features are accessed.

### Known Infrastructure Gaps
- No `docker-compose.yml` for local development orchestration
- No `.env.example` for environment variable documentation
- No frontend CI/CD pipeline (only backend builds in GitHub Actions)
- No staging environment or deployment manifests (K8s, etc.)
- No structured observability (metrics, tracing, centralized logging)

### Code Quality Notes
- **Backend:** Solid async patterns, generic CRUD base, custom exceptions. Thin test coverage.
- **Frontend:** Feature-rich but contains "god components" (`TerminalCockpit.tsx` 1,723 lines, `CartSideBar.tsx` 1,855 lines) that need decomposition.
- **DevOps:** Minimal — backend builds to GHCR on push to `main` or tags.

---

## 📱 Key Design Principles

- Simplicity first — built for non-technical users
- Fast and reliable (even with unstable networks)
- Strong focus on staff accountability
- Calm, clear, and professional user interface
- Mobile-friendly

---

## 🚀 Getting Started

> **Prerequisites:** Docker, Python 3.12+, Node.js 20+, PostgreSQL, Redis

### Backend

```bash
cd backend
# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
# or using uv:
uv sync

# Set environment variables (see required vars in app/core/config.py)
# Run migrations
alembic upgrade head

# Start the server
fastapi run app/main.py --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> ⚠️ **Note:** An `.env.example` file is not yet present. Refer to `backend/app/core/config.py` for required environment variables.

---

## 🧪 Testing

```bash
cd backend
pytest testing/ -v
```

Current test coverage is limited to CRUD base, products, stores, and basic app startup. Auth routes and frontend tests are not yet present.

---

## 📄 Documentation

- [docs/tawala.md](docs/tawala.md) — Product overview
- [docs/billing.md](docs/billing.md) — Billing & subscriptions
- [docs/Marketing.md](docs/Marketing.md) — Marketing positioning
- [docs/privacy-policy.md](docs/privacy-policy.md) — Privacy policy
- [docs/terms-of-service.md](docs/terms-of-service.md) — Terms of service
- [docs/data-policy.md](docs/data-policy.md) — Data handling policy

---

## 🤝 Contributing

This project follows a PR-based workflow. Please:
1. Create a feature branch from `main`
2. Make your changes
3. Open a pull request for review

Do not push directly to `main`.

---

## 📜 License

Proprietary — NetHub Ltd.

---

*Built with care for Kenyan SMEs.*
