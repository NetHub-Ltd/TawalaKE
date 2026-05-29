# Tawala Feature Specification & Development Roadmap

**Document Type:** Technical Feature Requirements  
**Version:** 1.0  
**Date:** May 2026  
**Purpose:** This document serves as the single source of truth for all features that need to be built. It is aligned with `tawala.md` and `billing.md`.

---

## 1. Product Vision Alignment

Tawala is a **Business Management System** (not just POS) focused on giving Kenyan SMEs **control, clarity, and simplicity**.

All features must follow these principles:
- Simplicity first (avoid over-engineering)
- Fast performance at the counter
- Strong staff accountability
- Proper multi-tenancy (`organization` → multiple `businesses`)
- Feature gating based on subscription plan

---

## 2. Feature Roadmap

### MVP / Phase 1 (Must be completed first)

#### Authentication & User Management
- Organization signup and setup
- User invitation system (email)
- Role-based access: Owner, Manager, Staff
- **Hybrid Authentication**:
  - Email + Password (for owners/managers)
  - 4-digit PIN login for staff (with explicit salt + Argon2)
- Refresh token rotation + secure token handling
- Password/PIN reset flow

#### Organization & Business Management
- Create Organization
- Create multiple Businesses (shops/branches) under one Organization
- Switch between businesses in the UI
- Basic organization and business settings (name, logo, address, tax info)

#### Staff Management
- Add, edit, deactivate staff
- Assign staff to specific businesses (or all)
- Role assignment
- PIN setup and management (reset by owner/manager)

#### Sales & POS
- Fast product search (by name, barcode)
- Cart / Sale creation
- Support for different payment methods (Cash, M-Pesa placeholder, Card)
- Record sales with staff attribution
- Hold / Resume sale (optional)

#### Invoicing & Receipts
- Create invoice from sale or standalone
- Generate professional receipts
- PDF generation and download/print
- Basic receipt customization (business details)

#### Product & Service Catalog
- Add/Edit products and services
- Price management
- Basic stock quantity tracking

#### Customer Management
- Add/Edit customers
- Basic customer search
- Track customer balances (credit)

#### Reporting (Basic)
- Daily sales summary
- Total sales, profit overview
- Outstanding invoices

#### Subscription & Billing
- Plan selection (Basic, Ndovu, Enterprise)
- Feature flag enforcement based on plan
- Subscription status checking

---

### Phase 2 (After MVP)

#### Inventory Management (Enhanced)
- Low stock alerts
- Stock history / audit
- Stock adjustment (damaged, lost, etc.)

#### Advanced Reporting & Analytics
- Profit & Loss report
- Sales by staff
- Sales by business/branch
- Top selling items
- Monthly trends

#### Expense Tracking
- Record business expenses
- Expense categories
- Basic expense reports

#### Customer Enhancements
- Customer credit/limit management
- Purchase history per customer

#### Staff Enhancements
- Staff performance reports
- Activity log (who made what sale)

#### Multi-Business Improvements
- Consolidated dashboard across businesses
- Cross-business reporting (for owners)

---

### Phase 3 / Enterprise Features

- Supplier management & purchase orders
- Advanced inventory (batch/lot tracking)
- Full audit trail (who changed what and when)
- API Access
- Offline mode support
- Custom reports builder
- Payment gateway integrations (M-Pesa Daraja, etc.)
- White labeling / custom domain
- SSO

---

## 3. Feature Gating Matrix (Critical for Development)

| Feature                              | Basic     | Ndovu       | Enterprise   |
|--------------------------------------|-----------|-------------|--------------|
| Number of Businesses                 | 1         | 5           | Unlimited    |
| Staff Accounts                       | 3         | Unlimited   | Unlimited    |
| Products                             | 300       | 5,000       | Unlimited    |
| Customers                            | 200       | 5,000       | Unlimited    |
| Monthly Transactions                 | 1,000     | 15,000      | Unlimited    |
| Receipt Customization                | No        | Yes         | Yes          |
| Advanced Reports                     | No        | Yes         | Yes          |
| Expense Tracking                     | No        | Yes         | Yes          |
| API Access                           | No        | No          | Yes          |
| Audit Trail                          | No        | Basic       | Full         |
| Offline Support                      | No        | Limited     | Full         |

---

## 4. Non-Functional Requirements

- **Performance**: POS flow must feel instant (< 1s for key actions)
- **Security**: All data properly scoped by `organization_id` and `business_id`
- **Usability**: Mobile-friendly, calm UI, minimal clicks
- **Reliability**: Graceful handling of network issues
- **Scalability**: Multi-tenant architecture from day one

---

## 5. Technical Modules to Implement

1. **Core** (Auth, Security, Tenancy)
2. **Billing & Subscriptions**
3. **Organization & Business**
4. **Staff Management**
5. **Catalog (Products/Services)**
6. **Sales & Transactions**
7. **Invoicing & Receipts**
8. **Customers**
9. **Reports**
10. **Inventory** (Phase 2)
11. **Expenses** (Phase 2)

---

**Recommendation**:  
Build **Phase 1 (MVP)** first with strong foundations in Authentication, Multi-tenancy, and Feature Flags. Then expand.

---

This document should be your main reference when deciding what to build next.

Would you like me to:
- Break this down into **User Stories** with acceptance criteria?
- Create a **Database Schema** document next?
- Or start building the actual models/routers for a specific module (e.g. Auth or Organization)?

Let me know how you'd like to proceed.