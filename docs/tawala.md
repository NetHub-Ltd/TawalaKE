# Tawala Product Specification Document

**Version:** 1.0  
**Date:** May 2026  
**Product Type:** Business Management System (BMS)  
**Target Market:** Kenyan SMEs

---

## 1. Product Overview

**Tawala** is a modern **Business Management System** built for Kenyan small and medium enterprises.

> **“Tawala biashara yako”** — Take control of your business.

Tawala helps business owners move from manual operations (exercise books, calculators, WhatsApp records, and memory) to a simple, organized, and reliable digital system.

It is **more than a POS** — it is a complete business operating layer that brings clarity, control, and accountability.

---

## 2. Core Purpose & Promise

**Core Promise:**
> We help you run your biashara with clarity and control.

**Mission:**
Empower Kenyan SMEs with simple, powerful, and affordable tools to manage sales, stock, staff, and finances effectively.

---

## 3. Target Users

- Shop owners and managers
- Minimarts, retail shops, wholesalers
- Pharmacies, hardware stores, agrovet shops
- Salons, barbershops, boutiques
- Restaurants, cafes, cyber cafes
- Growing SMEs managing multiple businesses

**User Reality:**
Many users have low-to-medium tech comfort. The system must be simple, fast, and reliable even on shared devices and unstable networks.

---

## 4. Key Problems Solved

- Manual record keeping and lost data
- Poor stock visibility and leakages
- Lack of staff accountability
- No clear view of daily sales and profit
- Difficulty managing multiple businesses/branches
- Slow and painful reporting
- Complicated tools that don’t fit Kenyan biashara workflows

---

## 5. Core Features (MVP Scope)

### Phase 1 – Foundation (What we are building now)

1. **Multi-Tenant Organization Structure**
   - One Organization can manage multiple Businesses (shops, branches, etc.)
   - Easy switching between businesses

2. **Staff Management & Accountability**
   - Add/remove staff
   - Role-based access (Owner, Manager, Staff)
   - **4-digit PIN authentication** for quick staff login (especially at counter)
   - Activity tracking

3. **Sales & Transactions**
   - Fast sales recording
   - More than basic POS functionality

4. **Invoicing & Receipts**
   - Create professional invoices
   - Generate receipts (printable and digital)
   - Support for cash, M-Pesa, card, etc.

5. **Customer Management**
   - Basic customer database
   - Track customer balances

6. **Basic Reporting**
   - Daily/weekly sales
   - Outstanding invoices
   - Top products
   - Simple profit overview

7. **Product/Service Catalog**
   - Manage items with prices
   - Basic stock tracking (optional in MVP)

---

## 6. Technical Architecture

- **Backend**: FastAPI (Python)
- **Frontend**: To be defined (Next.js recommended)
- **Database**: PostgreSQL with strong multi-tenancy (`organization_id` + `business_id`)
- **Authentication**: Hybrid system
  - Email + Password (for owners/managers)
  - 4-digit PIN (for staff daily use)
- **Security**: Argon2 hashing, JWT with refresh token rotation, proper multi-tenant scoping
- **Design Direction**: Modular, API-first, scalable, auditable

---

## 7. Product Principles

### Must Always Follow:
- **Simplicity over Features** – If it adds complexity without clear value, remove it.
- **Speed is Trust** – Every interaction must feel fast.
- **Progressive Complexity** – Simple for new users, powerful as they grow.
- **Real Business First** – Every feature must serve sales, stock, staff, or profit.
- **Clarity & Control** – The user must always feel in control.
- **Built for Kenya** – Designed for local realities (network issues, shared devices, non-technical users).

---

## 8. UX/UI Principles

- UI must feel **calm, clear, and in control**
- One primary action per screen
- Familiar patterns (receipts, ledgers, simple dashboards)
- Minimal cognitive load
- Instant feedback on every action
- Mobile-friendly (many staff will use on phones)

**Preferred Language:**
- Sales, Stock, Reports, Transactions, Customers, Staff

---

## 9. Brand & Communication

**Tone:** Simple, direct, empowering, human, confident.  
**Taglines:**
- Tawala biashara yako
- From hustle to structure
- Business under control
- Stay in control of your biashara

**Personality:** Trusted assistant, calm operator, disciplined business partner.

---

## 10. Future Capabilities (Post MVP)

- Advanced Inventory with stock alerts
- Full Payment integrations (M-Pesa, etc.)
- Expense tracking
- Supplier management
- Payroll
- Advanced analytics & dashboards
- Offline mode support
- E-commerce / online ordering

---

## 11. Success Definition

Tawala is successful when a Kenyan business owner can:
- Know their real profit without stress
- Trust their staff at the counter
- Find important information quickly
- Feel confident they are in control of their biashara

---

**Document Purpose:**  
This spec serves as the single source of truth for product, engineering, design, and marketing decisions.

**Next Step:** Align all development (especially authentication, multitenancy, invoicing, and staff modules) to this document.