# Tawala Billing & Pricing Specification

**Version:** 1.1  
**Date:** August 2026  
**Document Purpose:** Define pricing tiers, feature limits, and business rules for the Tawala Business Management System. Source of truth for seed data is `backend/app/utils/plans.py` (`PLANS_SEED`).

---

## Overview

Tawala uses a **three-tier subscription model**:

- **Basic** — Entry level for small single-location businesses
- **Ndovu** — The sweet spot (recommended for most users)
- **Enterprise** — Multi-branch operations with finite capacity ceilings (not unlimited)

All self-serve plans are billed **monthly** or **annually** (~20% discount on annual where offered). Enterprise annual pricing is sales-led.

---

## Pricing Tiers

| Tier | Monthly Price | Annual Price (~20% off) | Target Audience |
|------|---------------|-------------------------|-----------------|
| **Basic** | **KSh 1,490** | **KSh 14,300** | Single shop starters |
| **Ndovu** | **KSh 2,499** | **KSh 29,988** | Growing SMEs (Recommended) |
| **Enterprise** | **KSh 8,990** | Custom | Multi-branch / complex ops |

**Trials:** Basic & Ndovu — 7 days; Enterprise — 14 days (self-serve trial of Ndovu features is the default onboarding path).

---

## Capacity limits (paywall)

`None` is **not** used on public plans. Enterprise defines the product ceiling for this price band.

| Limit | Basic | Ndovu | Enterprise |
|-------|------:|------:|-----------:|
| Businesses / branches | 1 | 5 | **20** |
| Staff accounts | 3 | **25** | **100** |
| Products / services | 300 | 5,000 | **25,000** |
| Customers | 200 | 5,000 | **25,000** |
| Transactions / month | 1,000 | 15,000 | **75,000** |
| Invoices / month | 500 | 8,000 | **40,000** |
| Data retention | 6 months | 12 months | **36 months** |

Larger footprints than Enterprise require a custom quote.

---

## Feature matrix (paywall)

| Feature | Basic | Ndovu | Enterprise |
|---------|:-----:|:-----:|:----------:|
| POS & sales | Yes | Yes | Yes |
| Invoicing | Yes | Yes | Yes |
| Basic stock tracking | Yes | Yes | Yes |
| Full inventory | No | Yes | Yes |
| Low-stock alerts | No | Yes | Yes |
| Customer management | Yes | Yes | Yes |
| Customer credit | No | Yes | Yes |
| Expense tracking | No | Yes | Yes |
| Multi-business | No | Yes | Yes |
| Receipt customization | No | Yes | Yes |
| Daily sales report | Yes | Yes | Yes |
| Advanced reports | No | Yes | Yes |
| Profit & loss | No | Yes | Yes |
| Staff performance | No | Yes | Yes |
| Custom reports | No | No | Yes |
| PIN login | Yes | Yes | Yes |
| Audit trail | No | Basic | Full |
| **API access** | No | **Limited** | **Standard** |
| SSO | No | No | Yes |
| Enhanced security | No | No | Yes |
| Email support | Yes | Yes | Yes |
| WhatsApp support | No | Yes | Yes |
| Phone support | No | No | Yes |
| Priority support | No | Yes | Yes |
| Dedicated account manager | No | No | Yes |
| Onboarding training | No | No | Yes |
| Automatic backups | No | Yes | Yes |
| Offline mode | No | Limited | Full |
| Supplier management | No | No | Yes |
| Purchase orders | No | No | Yes |
| Batch tracking | No | No | Yes |
| Custom domain | No | No | Yes |
| **White label** | No | **Yes** | Yes |
| CSV export | Yes | Yes | Yes |
| PDF export | No | Yes | Yes |

### API access grades (enforced by paywall middleware)

| Grade | Plans | Keys | Requests / day |
|-------|-------|-----:|---------------:|
| Off (`false`) | Basic | 0 | 0 |
| **Limited** | Ndovu | 1 | **2,000** |
| **Standard** | Enterprise | 5 | **20,000** |

Grades are stored on the plan as `features.api_access` (`false` | `"limited"` | `"standard"`). Numeric quotas are applied in application code (not separate DB limit columns).

### White label

- **Ndovu:** logo / branding on receipts and customer-facing surfaces controlled by Tawala.
- **Enterprise:** white label + custom domain + SSO.

---

## Add-ons

| Add-on | Price | Notes |
|--------|-------|-------|
| Extra business | KSh 990 / month | Beyond plan `max_businesses` (sales / support) |
| SMS notifications | KSh 0.80 per SMS | Receipts, low stock, etc. |
| Data migration support | KSh 15,000 one-time | Optional professional service |

---

## Billing rules

- **Billing cycle:** Monthly on subscription date, or annually where offered
- **Payment methods:** M-Pesa, card, bank transfer (as integrated)
- **Grace period:** 7 days after due date before suspension
- **Downgrade:** Allowed; capacity limits are enforced after change
- **Upgrade:** Immediate access to new limits and features
- **Cancellation:** Anytime; data retained for 30 days after cancellation (product policy)

---

## Implementation reference

| Concern | Location |
|---------|----------|
| Seed data | `backend/app/utils/plans.py` → `PLANS_SEED` |
| Validation | `backend/app/schemas/plans.py` → `PlanSeed` / `PlanLimits` / `PlanFeatures` |
| Upsert on startup | `backend/app/prestart.py` → `seed_plans()` |
| Public catalog API | `GET` organizations plans (active + public) |
| UI cards | `frontend/src/features/org/components/PlanCard.tsx` |
| Onboarding plans page | `frontend/src/app/(public)/onboarding/plans/page.tsx` |

**Next:** plan-based paywall enforcement (limits + feature flags) on backend and gated UI.
