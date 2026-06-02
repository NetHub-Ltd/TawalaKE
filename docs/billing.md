# Tawala Billing & Pricing Specification

**Version:** 1.0  
**Date:** May 2026  
**Document Purpose:** Define pricing tiers, feature limits, and business rules for the Tawala Business Management System.

---

## Overview

Tawala uses a **three-tier subscription model**:

- **Basic** — Entry level for small single-location businesses
- **Ndovu** — The sweet spot (recommended for most users)
- **Enterprise** — For complex, multi-branch operations

All plans are billed **monthly** or **annually** (20% discount on annual).

---

## Pricing Tiers

| Tier          | Monthly Price | Annual Price (20% off) | Target Audience                     |
|---------------|---------------|-------------------------|-------------------------------------|
| **Basic**     | KSh 1,490    | KSh 14,300             | Single shop starters                |
| **Ndovu**     | **KSh 3,990**| **KSh 38,300**         | Growing SMEs (Recommended)          |
| **Enterprise**| KSh 9,990+   | Custom                 | Complex / Multi-branch businesses   |

---

## Detailed Tier Breakdown

### 1. Basic Plan

**Best for**: Small single-location businesses transitioning from manual records.

**Limits**:
- Maximum **1 Business**
- Maximum **3 Staff** members
- Maximum **300 Products/Services**
- Maximum **200 Customers**
- Maximum **1,000 Transactions per month**
- Maximum **500 Invoices per month**

**Included Features**:
- Sales & POS transactions
- Invoicing & digital receipts
- Basic stock tracking (quantity only)
- Customer management
- Daily sales summary report
- 4-digit PIN login for staff
- Email support only
- Data export (CSV)

**Not Available**:
- Multiple businesses
- Receipt/invoice customization (logo, custom text)
- Staff performance reports
- Expense tracking
- Advanced analytics
- API access

---

### 2. Ndovu Plan (Recommended)

**Name Meaning**: "Ndovu" = Elephant in Kiswahili → Symbol of strength, memory, and reliability.

**Best for**: Growing businesses with 1–5 locations that need real control and visibility.

**Limits**:
- Maximum **5 Businesses** (shops/branches)
- **Unlimited Staff**
- Maximum **5,000 Products/Services**
- Maximum **5,000 Customers**
- Maximum **15,000 Transactions per month**
- Maximum **8,000 Invoices per month**
- 12 months of historical data

**Included Features**:
- Everything in Basic +
- Multi-business management & switching
- Professional invoice & receipt customization (logo, business details, thank you message)
- Full inventory management with low stock alerts
- Customer credit & balance tracking
- Expense tracking
- Advanced reports:
  - Profit & Loss
  - Sales by staff / by business
  - Top selling items
  - Monthly trends & comparisons
- Staff activity & performance tracking
- Priority email + WhatsApp support
- Automatic data backups
- CSV + PDF exports

**This is the sweet spot plan** — designed to deliver maximum value and encourage upgrades from Basic.

---

### 3. Enterprise Plan

**Best for**: Established businesses with complex operations, multiple branches, or teams above 20 people.

**Limits**:
- **Unlimited Businesses**
- **Unlimited Staff**
- **Unlimited Products & Customers**
- **Unlimited Transactions & Invoices**
- 36+ months of historical data

**Included Features**:
- Everything in Ndovu +
- Advanced permissions & audit trail (who did what and when)
- Supplier management & purchase orders
- Batch / Lot tracking (for pharmacies, hardware, etc.)
- Custom reports & dashboard builder
- API Access for third-party integrations
- Full payment integrations (M-Pesa, Card, Bank)
- Offline-first capabilities
- Dedicated account manager
- Phone + WhatsApp priority support
- Staff onboarding & training support
- Custom domain & white labeling (optional)
- SSO (Single Sign-On)
- Enhanced security & compliance features

**Pricing**: Starts at **KSh 9,990/month**. Final price is custom quoted based on number of businesses, users, and specific requirements.

---

## Add-ons (Available on all plans)

| Add-on                          | Price                  | Notes |
|--------------------------------|------------------------|-------|
| Extra Business                 | KSh 990 / month       | Per additional business beyond plan limit |
| SMS Notifications              | KSh 0.80 per SMS      | For receipts, low stock, etc. |
| Custom Domain + White Label    | KSh 4,500 one-time    | Enterprise only |
| Data Migration Support         | KSh 15,000 one-time   | One-time service |

---

## Billing Rules

- **Free Trial**: 14 days of full Ndovu features
- **Billing Cycle**: Monthly on subscription date, or annually
- **Payment Methods**: M-Pesa, Card, Bank Transfer
- **Grace Period**: 7 days after due date before suspension
- **Downgrade**: Allowed, but data limits will be enforced
- **Upgrade**: Instant — user gets immediate access to new features
- **Cancellation**: Can cancel anytime. Data retained for 30 days after cancellation

---

## Feature Matrix Summary (For Development)

**Use this table for implementation of feature gating:**

| Feature                            | Basic     | Ndovu      | Enterprise |
|------------------------------------|-----------|------------|----------|
| Number of Businesses               | 1         | 5          | Unlimited |
| Staff Accounts                     | 3         | Unlimited  | Unlimited |
| Products                           | 300       | 5,000      | Unlimited |
| Customers                          | 200       | 5,000      | Unlimited |
| Monthly Transactions               | 1,000     | 15,000     | Unlimited |
| Receipt Customization              | No        | Yes        | Yes |
| Advanced Reports & Analytics       | No        | Yes        | Yes |
| Expense Tracking                   | No        | Yes        | Yes |
| API Access                         | No        | No         | Yes |
| Audit Trail                        | No        | Basic      | Full |
| Offline Mode                       | No        | Limited    | Full |

---

**This document should be used as reference for:**
- Feature flags implementation
- Backend permission checks
- Frontend plan display
- Onboarding flow
- Stripe/Lemon Squeezy/Paystack integration logic

---

**Next Steps:**
- Implement plan-based feature flags
- Create subscription management endpoints
- Build pricing page using this spec
