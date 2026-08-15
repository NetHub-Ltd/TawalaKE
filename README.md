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
| **Basic** | KSh 999 | Single small shops |
| **Ndovu** | **KSh 1,999** | Growing businesses (Recommended) |
| **Enterprise** | KSh 3999+ | Complex & multi-branch operations |

**14-day free trial** on the Ndovu plan.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL with strong multi-tenancy
- **Authentication**: Hybrid (Email/Password + 4-digit PIN)
- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Architecture**: Multi-tenant, API-first, scalable

---

## 📱 Key Design Principles

- Simplicity first — built for non-technical users
- Fast and reliable (even with unstable networks)
- Strong focus on staff accountability
- Calm, clear, and professional user interface
- Mobile-friendly

---

## 🏗️ Project Structure

```text
tawala/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── core/             # security, config, dependencies
│   │   ├── api/              # routers (auth, sales, billing, etc.)
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── utils/            # helpers
│   └── main.py
├── frontend/                 # Next.js frontend
├── docs/                     # Documentation
│   ├── tawala.md
│   ├── billing.md
│   ├── marketing.md
│   └── README.md
└── .env.example
