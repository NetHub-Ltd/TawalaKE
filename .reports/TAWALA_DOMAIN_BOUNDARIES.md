# TAWALA DOMAIN BOUNDARIES

**Version:** 1.0.0  
**Status:** Objective Architecture Proposal  
**Depends On:** `TAWALA_CORE_ARCHITECTURE.md` and `TAWALA_SECURITY_MODEL.md`

---

# 1. Purpose

This document defines the major business domains inside Tawala and the boundaries between them.

The goal is simple:

> Each domain owns a clear responsibility and exposes capabilities to other domains without becoming tightly coupled to them.

Tawala should be capable of growing from a POS into a full Business Management System without becoming one enormous application where every part knows everything about every other part.

---

# 2. The Big Picture

Tawala is not one giant business module.

It is a collection of cooperating domains built around a shared platform core.

```text
                         TAWALA PLATFORM
                               |
        +----------------------+----------------------+
        |                      |                      |
      CORE                  SECURITY               PLATFORM
        |                      |                      |
        +----------------------+----------------------+
                               |
              +----------------+----------------+
              |                |                |
            SALES          INVENTORY          CRM
              |                |                |
              +--------+-------+--------+-------+
                       |                |
                  PURCHASING        PAYMENTS
                       |                |
                       +-------+--------+
                               |
                          ACCOUNTING
                               |
                         REPORTING
````

This is a conceptual map, not a required deployment topology.

The domains may initially live inside one application.

The important thing is that their **responsibilities remain separate**.

---

# 3. What Is a Domain?

A domain is an area of business responsibility.

For example:

```text
Sales
```

owns the concepts and rules surrounding selling.

```text
Inventory
```

owns the concepts and rules surrounding stock.

```text
CRM
```

owns customer relationships.

A domain should answer:

> "What business problem do I own?"

It should not answer every question in the system.

---

# 4. The Domain Ownership Rule

Every important concept should have one clear owner.

For example:

```text
Customer       → CRM
Product        → Catalog
Stock Level    → Inventory
Sale           → Sales
Purchase Order → Purchasing
Payment        → Payments
Invoice        → Sales / Accounting boundary
Expense        → Accounting
User           → Identity
Role           → Security
Branch         → Organization
```

Other domains may reference these concepts.

They should not secretly create competing versions of them.

---

# 5. Domain Categories

Tawala can be divided into four broad categories.

## Platform Domains

```text
Core
Identity
Security
Organization
Configuration
Audit
```

## Operational Domains

```text
Catalog
Sales
Inventory
Purchasing
CRM
Payments
```

## Financial Domains

```text
Accounting
```

## Presentation / Intelligence Domains

```text
Reporting
Notifications
Automation
```

This separation gives the system room to grow.

---

# 6. Core

Core provides foundational capabilities used by the rest of Tawala.

Core should remain deliberately generic.

It provides concepts such as:

```text
Business
Organization
Branch
Location
Currency
Units
Identifiers
System events
Domain events
Time
Configuration primitives
```

Core should not contain:

```text
Sales logic
Inventory logic
CRM workflows
Accounting rules
```

Core provides the foundation.

It does not become the dumping ground for everything.

---

# 7. Identity

Identity answers:

> Who is this person?

Identity owns:

```text
User
Authentication identity
Sessions
Credentials
Identity verification
Account status
```

Identity does not decide what a user can do inside a business.

That belongs to Security.

---

# 8. Security

Security answers:

> What is this identity allowed to do?

Security owns:

```text
Membership
Roles
Permissions
Scopes
Authorization policies
Security events
```

Security should not own business operations.

For example:

```text
Security:
"Can Jane create a sale?"

Sales:
"How is a sale created?"
```

This distinction is important.

---

# 9. Organization

Organization defines the structure of a business.

Conceptually:

```text
Business
 |
 +-- Branch
      |
      +-- Location
```

Organization owns:

```text
Business
Branch
Business locations
Organizational relationships
```

Other domains use organizational context.

For example:

```text
Inventory → stores stock at a location
Sales     → records sales at a branch
Users     → receive branch scope
```

---

# 10. Catalog

Catalog defines what the business offers.

This includes:

```text
Products
Services
Product categories
Variants
Units
Pricing definitions
Barcodes
SKU information
Product metadata
```

Catalog answers:

> What can this business sell or manage?

Catalog does not own stock quantities.

That belongs to Inventory.

---

# 11. Why Catalog and Inventory Are Separate

A product is not the same thing as its stock.

Example:

```text
Product:
Samsung Galaxy A15
```

belongs to Catalog.

Its current quantity:

```text
Nairobi Branch: 14
Embu Branch: 8
```

belongs to Inventory.

This distinction becomes extremely important when Tawala supports:

* Multiple branches
* Transfers
* Stock adjustments
* Warehouses
* Purchasing
* Stock reservations

---

# 12. Sales

Sales owns the selling process.

It may contain:

```text
Quotes
Sales Orders
Invoices
Receipts
Returns
Sales Lines
Discounts
Taxes related to sales
Sales status
```

Sales answers:

> What did the business sell?

Sales should not become the owner of inventory quantities.

Instead, it requests inventory operations where required.

---

# 13. Sales and Inventory

Example:

```text
Customer buys:
2 × Product A
```

Sales records:

```text
Sale created
```

Inventory responds by performing the appropriate stock movement.

Conceptually:

```text
Sales
  |
  | Stock required
  ↓
Inventory
  |
  | Stock movement
  ↓
Inventory updated
```

Sales should not directly manipulate:

```text
stock.quantity -= 2
```

inside its own domain.

That is Inventory's responsibility.

---

# 14. CRM

CRM owns customer relationships.

It may contain:

```text
Customers
Contacts
Customer profiles
Purchase relationship history
Credit relationship information
Follow-up notes
Customer interactions
Segments
Customer communication preferences
```

CRM answers:

> Who does the business deal with, and what is the relationship?

CRM does not own the sale itself.

It may reference sales history.

---

# 15. CRM and Sales

Sales may reference:

```text
customer_id
```

CRM owns the customer.

Sales owns the transaction.

This prevents duplication such as:

```text
SalesCustomer
CRMCustomer
InvoiceCustomer
```

all representing slightly different versions of the same person.

There should be one authoritative customer identity.

---

# 16. Purchasing

Purchasing owns the procurement process.

It may contain:

```text
Suppliers
Purchase Requests
Purchase Orders
Goods Received
Purchase Returns
Supplier relationships
Supplier balances
```

Purchasing answers:

> What does the business acquire from suppliers?

---

# 17. Purchasing and Inventory

Purchasing does not directly edit stock quantities.

Example:

```text
Purchase Order
      |
Goods Received
      |
Inventory
      |
Stock increases
```

Purchasing records the procurement event.

Inventory records the resulting stock movement.

This creates a clean separation.

---

# 18. Supplier

Supplier information belongs primarily to Purchasing.

However, suppliers may eventually participate in broader relationship management.

The system should avoid creating unnecessary duplicate supplier models across domains.

If Tawala eventually introduces a generalized party/contact model, Supplier and Customer may become specialized business relationships around shared identities.

That is an architectural evolution point, not something that must be forced into version one.

---

# 19. Payments

Payments owns the movement and recording of payment transactions.

Examples:

```text
Cash
M-PESA
Card
Bank
Other supported payment methods
```

Payments answers:

> How was money received, sent, allocated, refunded, or reconciled?

Payments does not own the sale.

A sale may request or reference a payment.

---

# 20. Sales and Payments

Example:

```text
Sale
 |
Amount due: KES 5,000
 |
Payment
 |
KES 5,000 received
```

Sales knows:

```text
The customer owes KES 5,000.
```

Payments knows:

```text
KES 5,000 was received through M-PESA.
```

This distinction allows Tawala to support:

* Partial payments
* Multiple payments
* Refunds
* Payment reconciliation
* Payment integrations

without making Sales responsible for payment infrastructure.

---

# 21. Accounting

Accounting owns financial records and accounting rules.

It may contain:

```text
Accounts
Journal entries
Expenses
Income records
Debtors
Creditors
Financial periods
Balances
Financial statements
```

Accounting answers:

> What does this mean financially for the business?

---

# 22. Accounting Is Not Sales

A sale is a business transaction.

An accounting entry is its financial representation.

For example:

```text
Sale
 |
Financial effect
 |
Accounting
```

Sales should not directly implement the accounting ledger.

Instead, a completed business transaction can produce an event that Accounting consumes.

---

# 23. Accounting as a Consumer

Conceptually:

```text
Sales
  |
  | SaleCompleted
  ↓
Accounting
  |
  +-- Record income
  +-- Record receivable
  +-- Update financial records
```

Similarly:

```text
Purchasing
  |
  | PurchaseReceived
  ↓
Accounting
```

and:

```text
Payments
  |
  | PaymentReceived
  ↓
Accounting
```

This keeps financial logic centralized.

---

# 24. Inventory Accounting

Inventory introduces another important boundary.

Inventory owns:

```text
Physical stock
Stock quantities
Stock movements
Transfers
Adjustments
```

Accounting owns:

```text
Financial valuation
Accounting entries
Cost recognition
Financial reporting
```

The two domains communicate.

Neither should absorb the other.

---

# 25. Reporting

Reporting should not become the owner of business data.

It consumes information from other domains.

For example:

```text
Sales
Inventory
Purchasing
Payments
Accounting
CRM
       |
       ↓
    Reporting
```

Reporting produces:

```text
Dashboards
KPIs
Charts
Reports
Aggregations
Business summaries
```

---

# 26. Reporting Is a Read Domain

A useful mental model is:

```text
Operational domains
        |
        ↓
   Events / data
        |
        ↓
    Reporting
```

Reporting should not modify the source domain merely because a dashboard needs something.

This keeps reporting from becoming entangled with business operations.

---

# 27. Audit

Audit records important actions.

Audit may receive events from:

```text
Sales
Inventory
Purchasing
Payments
Accounting
Security
Organization
```

For example:

```text
InventoryAdjusted
RefundCreated
RoleChanged
BusinessSettingsChanged
```

Audit records what happened.

It does not decide whether the action was allowed.

Security does that.

---

# 28. Notifications

Notifications deliver information.

Examples:

```text
Low stock
Payment received
Invoice due
Customer follow-up
Purchase order approved
User invitation
```

Notifications should not own the business condition that triggered them.

For example:

```text
Inventory detects low stock
        |
        ↓
Notification
        |
        ↓
SMS / Email / Push / In-app
```

---

# 29. Automation

Automation executes actions based on business events or configured rules.

Examples:

```text
When stock falls below threshold
    → notify manager

When invoice becomes overdue
    → notify customer

When purchase order is approved
    → notify supplier
```

Automation should consume domain events rather than embedding itself inside every domain.

---

# 30. Domain Events

Domains communicate through explicit events where appropriate.

Examples:

```text
SaleCompleted
SaleReturned
StockAdjusted
GoodsReceived
PaymentReceived
PaymentRefunded
CustomerCreated
InvoiceOverdue
RoleChanged
```

An event means:

> Something happened.

It does not mean:

> Another domain must do exactly one particular thing.

---

# 31. Commands vs Events

A useful distinction:

## Command

```text
"Do this."
```

Example:

```text
CreateSale
TransferStock
ReceiveGoods
CreatePayment
```

## Event

```text
"This happened."
```

Example:

```text
SaleCompleted
StockTransferred
GoodsReceived
PaymentReceived
```

Commands request actions.

Events communicate facts.

---

# 32. Dependency Direction

Domains should generally depend on abstractions or contracts rather than internal implementation details of other domains.

Good:

```text
Sales
 |
Domain Contract
 |
Inventory
```

Bad:

```text
Sales
 |
InventoryRepository
 |
InventorySQLModel
 |
InventoryDatabaseTable
```

The second approach tightly couples the domains.

---

# 33. Domain Communication

A domain may communicate through:

```text
Direct application service
Domain contract
Command
Domain event
Integration event
```

The correct mechanism depends on whether the operation is:

```text
Synchronous
Asynchronous
Required for transaction completion
Optional side effect
```

---

# 34. Synchronous Example

Creating a sale may require immediate stock validation.

Conceptually:

```text
Create Sale
   |
Check Inventory
   |
Stock Available?
   |
YES
   |
Complete Sale
```

This may be synchronous because the sale cannot safely complete without knowing whether the stock operation can happen.

---

# 35. Asynchronous Example

Sending a notification does not usually need to block the sale.

```text
SaleCompleted
      |
      +----→ Reporting
      |
      +----→ Notification
      |
      +----→ Automation
```

The sale should not fail simply because an SMS provider is temporarily unavailable.

---

# 36. The Dependency Rule

A domain should depend on another domain only when there is a real business relationship.

For example:

```text
Sales → Inventory
```

makes sense.

```text
Sales → Notifications
```

should generally not be a hard dependency.

Instead:

```text
Sales
 |
SaleCompleted
 |
Notification
```

---

# 37. Avoid Circular Dependencies

This is dangerous:

```text
Sales → Inventory
Inventory → Sales
```

Circular dependencies make systems difficult to reason about.

Instead, use contracts or events.

For example:

```text
Sales
 |
SaleCompleted
 ↓
Accounting
```

and:

```text
Inventory
 |
StockUpdated
 ↓
Reporting
```

---

# 38. Shared Kernel

Some concepts may genuinely be shared.

Examples:

```text
Identifiers
Money representation
Dates / time
Business context
Domain event structure
Pagination primitives
Common errors
```

These can form a small shared kernel.

But the shared kernel must remain small.

If every domain concept is placed into Core, Core becomes a giant dependency.

---

# 39. What Must NOT Be Shared

Avoid creating universal models for everything.

For example, do not automatically put:

```text
Sale
Invoice
Stock
Customer
Supplier
Payment
Expense
```

into Core simply because many domains use them.

Core should provide foundations.

Domain ownership should remain with the domain that actually understands the concept.

---

# 40. Industry Neutrality

Tawala must remain industry-neutral.

The core domains should not assume:

```text
Hardware store
Pharmacy
Salon
SACCO
Restaurant
Clothing store
Wholesale business
```

Instead:

```text
Business
 |
Capabilities
 |
Domains
 |
Industry configuration
```

Industry-specific behavior should be layered above generic capabilities.

---

# 41. Example: Pharmacy

A pharmacy may need:

```text
Products
Batch tracking
Expiry dates
Stock
Sales
Customers
Suppliers
Purchasing
Payments
```

The generic domains can support these capabilities.

Pharmacy-specific rules can be introduced without rewriting the entire platform.

---

# 42. Example: Kinyozi

A barbershop may need:

```text
Services
Customers
Appointments
Staff
Sales
Payments
```

It may barely use traditional inventory.

The same core still works.

---

# 43. Example: SACCO

A SACCO may need:

```text
Members
Contributions
Loans
Repayments
Accounts
Payments
Reports
```

Some of these capabilities may eventually require specialized financial domains.

The architecture should allow them to be added without corrupting the general-purpose core.

---

# 44. Industry Extensions

Tawala should support specialized domains or modules.

Conceptually:

```text
TAWALA CORE
     |
     +-- General Business Domains
     |
     +-- Industry Extensions
              |
              +-- Pharmacy
              +-- Hospitality
              +-- SACCO
              +-- Salon
              +-- Wholesale
```

Industry extensions use core capabilities.

They should not rewrite Core.

---

# 45. Configuration vs Custom Code

Not every industry difference requires a new domain.

Some differences can be configuration.

Example:

```text
Business
 |
Inventory enabled: YES
CRM enabled: YES
Appointments enabled: NO
```

Another business:

```text
Business
 |
Inventory enabled: NO
CRM enabled: YES
Appointments enabled: YES
```

Capabilities can therefore be composed according to business needs.

---

# 46. Capability Model

Tawala can think in terms of capabilities:

```text
Sales
Inventory
CRM
Purchasing
Payments
Accounting
Appointments
Memberships
Projects
```

A business may enable the capabilities it needs.

This is different from creating a completely separate application for every industry.

---

# 47. Multiple Industries in One Account

A user may operate:

```text
Business A
Industry: Pharmacy

Business B
Industry: Salon

Business C
Industry: Wholesale
```

All three businesses can use the same Tawala platform.

Their business configuration remains isolated.

The platform itself remains generic.

---

# 48. One Business, Multiple Capabilities

A business may also operate across industries.

Example:

```text
Business
 |
Retail
Wholesale
Services
```

The domain architecture should not assume that one business equals one industry.

Industry classification is metadata and configuration.

It is not the security boundary.

---

# 49. The Business Is the Tenant

This remains critical.

Industry does not determine tenancy.

```text
Tenant = Business
```

not:

```text
Tenant = Industry
```

This allows one platform to support any combination of industries.

---

# 50. Domain Boundary Example

Consider a customer buying a product.

```text
CRM
 |
Customer
 |
Sales
 |
Sale
 |
Inventory
 |
Stock movement
 |
Payments
 |
Payment
 |
Accounting
 |
Financial entry
 |
Reporting
 |
Dashboard
```

Each domain handles its own responsibility.

---

# 51. End-to-End Example

Customer buys 3 units of Product A for KES 3,000.

### Step 1 — CRM

Identifies the customer.

```text
Customer: Jane
```

### Step 2 — Sales

Creates the sale.

```text
Sale: 3 × Product A
Total: KES 3,000
```

### Step 3 — Inventory

Reserves or deducts stock.

```text
Stock movement: -3
```

### Step 4 — Payments

Records payment.

```text
Payment: KES 3,000
Method: M-PESA
```

### Step 5 — Accounting

Records financial effects.

### Step 6 — Reporting

Updates reporting projections.

### Step 7 — Audit

Records the important actions.

No domain needs to own the entire workflow.

---

# 52. Domain Boundary Table

| Domain        | Owns                              | Does Not Own         |
| ------------- | --------------------------------- | -------------------- |
| Core          | Shared foundations                | Business operations  |
| Identity      | User identity/authentication      | Business permissions |
| Security      | Roles, permissions, authorization | Sales logic          |
| Organization  | Business/branch structure         | Stock                |
| Catalog       | Products/services                 | Stock quantities     |
| Sales         | Selling transactions              | Physical stock       |
| CRM           | Customer relationships            | Sales transactions   |
| Purchasing    | Procurement                       | Stock quantities     |
| Inventory     | Physical stock                    | Sales                |
| Payments      | Payment transactions              | Sales                |
| Accounting    | Financial records                 | POS workflow         |
| Reporting     | Read models/reports               | Source transactions  |
| Audit         | Historical action records         | Authorization        |
| Notifications | Delivery                          | Business rules       |
| Automation    | Rule-driven actions               | Domain ownership     |

---

# 53. The Most Important Boundary

The most important rule is:

> **A domain owns its data and business rules. Other domains request capabilities or consume events; they do not reach inside and manipulate another domain's internals.**

This one principle prevents a huge amount of architectural decay.

---

# 54. Modular Monolith First

Tawala does not need microservices to have domain boundaries.

The recommended initial architecture is a modular monolith.

Conceptually:

```text
Tawala Backend
|
+-- Core
+-- Identity
+-- Security
+-- Organization
+-- Catalog
+-- Sales
+-- CRM
+-- Inventory
+-- Purchasing
+-- Payments
+-- Accounting
+-- Reporting
+-- Audit
+-- Notifications
+-- Automation
```

One deployment.

Clear internal boundaries.

---

# 55. Why Not Microservices Yet?

Microservices introduce operational complexity:

```text
Networking
Service discovery
Distributed transactions
Message delivery
Deployment coordination
Observability
Retries
Failure handling
Data ownership
```

Tawala needs domain boundaries first.

It does not need distributed deployment first.

---

# 56. Future Extraction

A well-designed modular monolith allows a domain to become a service later.

For example:

```text
Today:

Tawala
 |
 +-- Payments module
```

Potential future:

```text
Tawala
 |
 +-- Payments Service
```

The internal boundary already exists.

The deployment boundary can change later.

---

# 57. Database Boundary

Initially, Tawala may use one PostgreSQL database.

That does not mean every module should freely access every table.

The logical rule should remain:

```text
Domain → Owns its persistence
```

Other domains should interact through domain/application contracts.

This makes future database separation possible.

---

# 58. API Boundary

The external API should expose business capabilities.

Avoid exposing internal database structure as the public architecture.

Prefer:

```text
POST /sales
```

over designing the system around:

```text
POST /sale_table
```

The API should represent the business domain, not the ORM.

---

# 59. Frontend Boundary

The same domain boundaries should exist in the clients.

For example:

```text
Web
 |
+-- Sales
+-- Inventory
+-- CRM
+-- Purchasing
+-- Accounting
```

The UI may combine information for convenience.

But the backend remains the authoritative domain boundary.

---

# 60. Desktop, Web, Mobile

All clients consume the same platform.

```text
                 TAWALA CORE
                      |
                  TAWALA API
                      |
        +-------------+-------------+
        |             |             |
      Desktop         Web         Mobile
```

Desktop may expose the fullest operational experience.

Mobile may emphasize monitoring and management.

Web may emphasize accessibility and setup.

They are different experiences over the same business platform.

---

# 61. Hardware Boundary

Hardware integration belongs primarily to the client/integration layer.

Examples:

```text
Barcode scanner
Receipt printer
Cash drawer
Label printer
Biometric device
```

Sales should not know how a USB barcode scanner works.

The Desktop application or hardware integration layer translates hardware input into Tawala operations.

---

# 62. Example Hardware Flow

```text
Barcode Scanner
      |
      ↓
Desktop Client
      |
      ↓
Product Lookup
      |
      ↓
Sales
      |
      ↓
Inventory
```

The domain model remains hardware-independent.

---

# 63. Domain Events and Reporting

A reporting system should not repeatedly query every operational table for every dashboard request.

Instead, Tawala can eventually maintain read-optimized reporting models.

Conceptually:

```text
Sales Event
     |
     ↓
Reporting Projection
     |
     ↓
Dashboard
```

This allows reporting to evolve independently.

---

# 64. Domain Events and Audit

Audit can also consume important domain events.

```text
SaleCompleted
StockAdjusted
PaymentRefunded
RoleChanged
      |
      ↓
    Audit
```

This creates a consistent historical trail.

---

# 65. Domain Events Are Not the Database

Events should not become an excuse to remove normal transactional consistency.

If two operations must succeed together, they should be handled appropriately within the transactional boundary.

Events are especially useful for:

```text
Notifications
Reporting
Automation
Audit
Integrations
```

where asynchronous processing is acceptable.

---

# 66. Transaction Ownership

A transaction should normally be owned by the domain performing the business operation.

Example:

```text
Sales creates a sale
```

Sales controls the transaction required to make the sale valid.

If the operation requires inventory coordination, the architecture must explicitly define the consistency boundary.

Do not casually create distributed transactions between modules.

---

# 67. Domain Invariants

Each domain protects its own rules.

Examples:

### Sales

```text
A completed sale cannot silently become another sale.
```

### Inventory

```text
Stock movements must be valid.
```

### Payments

```text
A payment cannot be recorded as two different transactions.
```

### Security

```text
Unauthorized users cannot perform protected actions.
```

### Accounting

```text
Financial records must remain internally consistent.
```

The domain that owns a rule must enforce it.

---

# 68. Avoid Anemic Domains

A domain should not merely be:

```text
Models
Repositories
CRUD endpoints
```

Business behavior belongs close to the domain that owns it.

For example:

```text
Inventory.adjust_stock()
```

is conceptually better than allowing any random application service to directly modify:

```text
inventory.quantity
```

without passing through inventory rules.

---

# 69. Avoid God Services

Do not create:

```text
BusinessService
```

that handles:

```text
Sales
Inventory
CRM
Payments
Accounting
Purchasing
Users
```

This recreates the monolith problem inside a modular monolith.

Instead:

```text
SalesService
InventoryService
CRMService
PaymentService
PurchasingService
AccountingService
```

with explicit orchestration where workflows cross domains.

---

# 70. Orchestration

Some workflows naturally cross several domains.

Example:

```text
Checkout
```

may involve:

```text
Sales
Inventory
Payments
Accounting
Audit
```

There should be an application-level orchestration mechanism for such workflows.

But orchestration should coordinate domains.

It should not steal their business rules.

---

# 71. Example Checkout Orchestration

```text
Checkout
 |
 +-- Validate Sale
 |
 +-- Reserve/Deduct Inventory
 |
 +-- Record Payment
 |
 +-- Complete Sale
 |
 +-- Emit Events
```

Each domain remains responsible for its own rules.

The orchestrator coordinates the process.

---

# 72. Failure Handling

Cross-domain workflows must define what happens when something fails.

For example:

```text
Sale created
Inventory succeeds
Payment fails
```

The architecture must define whether:

```text
Sale is rolled back
Inventory is restored
Payment is retried
Transaction remains pending
```

This should be explicitly designed for each important workflow.

Never assume distributed workflows will "just work."

---

# 73. Domain Boundary Test

A domain boundary is healthy if you can answer:

```text
Who owns this concept?

Who owns its rules?

Who is allowed to modify it?

How do other domains request changes?

What events does it publish?

What does it consume?
```

If those answers are unclear, the boundary needs refinement.

---

# 74. Architecture Smell Test

These are warning signs:

```text
Sales imports Inventory database models
Inventory imports Sales models
Every module imports Core business models
One service modifies many domains directly
Shared database tables have many owners
Business logic exists in controllers
Business rules exist only in frontend code
Reporting modifies operational records
Notifications are required for core transactions
```

These should trigger architectural review.

---

# 75. Domain Boundary Rulebook

Tawala follows these rules:

```text
1. Every major business concept has one owner.

2. A domain owns its business rules.

3. A domain owns its persistence.

4. Other domains do not manipulate its internal data directly.

5. Cross-domain communication uses explicit contracts.

6. Events communicate facts.

7. Commands request actions.

8. Core remains generic.

9. Industry-specific logic stays outside the generic core.

10. Clients never become domain authorities.

11. Reporting does not own operational truth.

12. Audit records history but does not authorize actions.

13. Modular boundaries exist before deployment boundaries.

14. Microservices are optional; good domain boundaries are mandatory.

15. New domains should be introduced only when there is a clear responsibility to own.
```

---

# 76. Proposed Domain Map

The current architectural map is:

```text
PLATFORM
│
├── Core
├── Identity
├── Security
├── Organization
├── Configuration
└── Audit
│
BUSINESS OPERATIONS
│
├── Catalog
├── Sales
├── CRM
├── Inventory
├── Purchasing
└── Payments
│
FINANCE
│
└── Accounting
│
INTELLIGENCE & AUTOMATION
│
├── Reporting
├── Notifications
└── Automation
│
EXTENSIONS
│
└── Industry-specific domains
```

This is the proposed boundary map, not yet the final implementation structure.

---

# 77. What This Gives Tawala

With these boundaries, Tawala can evolve without turning every new feature into a rewrite.

For example:

```text
Today
→ POS

Tomorrow
→ Inventory

Then
→ CRM

Then
→ Purchasing

Then
→ Accounting

Then
→ Industry extensions
```

Each capability becomes another part of the same platform.

---

# 78. The Architectural Goal

Tawala should feel like one product to the customer.

Internally, it should behave like a collection of well-engineered systems.

```text
                 CUSTOMER EXPERIENCE

                    "TAWALA"
                       |
          +------------+------------+
          |            |            |
        Sales       Inventory      CRM
          |            |            |
      Purchasing    Payments    Accounting
          |            |            |
          +------------+------------+
                       |
                    Core
                       |
                  Security
```

The customer sees one system.

The engineer sees clear boundaries.

That is the objective.

---

# 79. Final Principle

> **Tawala is one platform, not one giant module.**

The platform provides the foundation.

Domains provide business capabilities.

Industry extensions provide specialization.

Clients provide different experiences.

Security protects the boundaries.

Events connect the domains.

And the customer experiences all of it as one Business Management System.

---

# 80. Architecture Status

**PROPOSED — READY FOR REVIEW**

This document intentionally does not define:

```text
Exact database tables
Exact Python/TypeScript classes
Exact API routes
Exact folder structure
Exact event broker
Exact deployment topology
```

Those decisions come after the domain boundaries are accepted.

The next engineering step is to turn these boundaries into concrete:

`TAWALA_DOMAIN_CONTRACTS.md`

That document will define:

```text
What each domain exposes
What each domain consumes
What each domain owns
What each domain is forbidden from touching
What data crosses a boundary
How domains communicate
Which operations are synchronous
Which operations are asynchronous
`