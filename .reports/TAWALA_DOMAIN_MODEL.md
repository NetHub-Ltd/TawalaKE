
# TAWALA DOMAIN MODEL

**Version:** 1.0.0  
**Status:** Objective Architecture Proposal  
**Depends On:** `TAWALA_CORE_ARCHITECTURE.md`

---

# 1. Purpose

This document defines the conceptual business model of Tawala.

It answers one fundamental question:

> **What things exist in the Tawala world, and how do those things relate to each other?**

This document intentionally avoids database tables, SQLModels, API routes, frontend components, and framework-specific implementation.

We are defining the business system first.

The implementation comes later.

---

# 2. The Tawala World

At the highest level, Tawala exists to represent:

```text
People
Businesses
Things
Places
Money
Documents
Actions
Relationships
````

These concepts interact to represent what happens inside a real business.

A simplified view:

```text
                         TAWALA
                            |
       +--------------------+--------------------+
       |                    |                    |
     PEOPLE               THINGS               PLACES
       |                    |                    |
    Customers            Products             Branches
    Suppliers            Services             Warehouses
    Employees            Resources            Locations
    Members
       |                    |                    |
       +--------------------+--------------------+
                            |
                       TRANSACTIONS
                            |
          +-----------------+-----------------+
          |                 |                 |
        Sales           Purchases         Services
          |                 |                 |
          +-----------------+-----------------+
                            |
                         MONEY
                            |
          +-----------------+-----------------+
          |                 |                 |
       Payments          Expenses         Accounting
                            |
                          EVENTS
                            |
                        AUDIT TRAIL
```

This is the conceptual foundation of Tawala.

---

# 3. Core Domain Principles

The domain model follows several rules.

## 3.1 The business is the primary context

Business data belongs to a business.

A user does not inherently own business data.

The user's access comes through their relationship with the business.

```text
User
  |
  +-- Membership
          |
          +-- Business
```

---

## 3.2 Industry is not the primary domain boundary

Tawala does not model:

```text
Pharmacy Business
Kinyozi Business
Hardware Business
```

as completely different foundations.

Instead, businesses use combinations of generic capabilities.

---

## 3.3 A thing should have one meaning

If two parts of Tawala refer to the same real-world concept, they should not create unrelated representations of it.

For example:

A customer created from CRM should be the same customer seen in Sales.

A product used in Inventory should be the same product used in Sales.

A payment recorded against an invoice should be the same payment visible in financial reporting.

---

## 3.4 Business actions create consequences

A business action is more than a database update.

For example:

```text
Sale Completed
```

may cause:

```text
Inventory decreases
Customer history changes
Payment is recorded
Accounting is updated
Loyalty is updated
Reports change
Audit record is created
```

The domain model must represent these relationships.

---

# 4. Domain Classification

Tawala's concepts can be grouped into several categories.

```text
IDENTITY
Business
User
Membership
Role
Permission

ORGANIZATION
Branch
Location
Resource

PARTIES
Party
Customer
Supplier
Member
Employee

CATALOG
Product
Service
Category

OPERATIONS
Document
Transaction
Stock Movement
Appointment
Task

MONEY
Payment
Account
Financial Entry

SYSTEM
Event
Audit Record
Configuration
```

These categories are conceptual.

They do not necessarily correspond one-to-one with implementation modules or database tables.

---

# 5. Business

## Definition

A Business represents an independent business operating inside Tawala.

Examples:

```text
ABC Hardware
Jane's Kinyozi
Mwangaza Pharmacy
Unity SACCO
```

A Business owns its operational data.

---

## Business owns or controls

A Business may have:

* Branches
* Users through memberships
* Customers
* Suppliers
* Products
* Services
* Inventory
* Sales
* Purchases
* Payments
* Financial records
* Configuration
* Reports
* Audit records

---

## Important rule

A Business is an isolation boundary.

Data belonging to one Business must not be accessible to another Business unless an explicitly designed cross-business capability exists.

---

# 6. User

## Definition

A User represents a person with an identity in Tawala.

A User is not automatically an employee of a business.

A User may participate in multiple businesses.

Example:

```text
David
 |
 +-- Business A → Owner
 |
 +-- Business B → Manager
 |
 +-- Business C → Accountant
```

The User's identity is separate from their business relationships.

---

# 7. Membership

## Definition

A Membership represents a user's relationship with a Business.

It answers:

> "What is this user allowed to do inside this business?"

A Membership connects:

```text
User
   |
Membership
   |
Business
```

The membership may define:

* Roles
* Permissions
* Organizational scope
* Status
* Business-specific settings

---

# 8. Role

## Definition

A Role is a named collection of permissions.

Examples:

```text
Owner
Administrator
Manager
Cashier
Accountant
Stock Manager
Salesperson
```

Roles are business-specific.

The same user may have different roles in different businesses.

---

# 9. Permission

## Definition

A Permission represents an allowed capability.

Examples:

```text
sales.create
sales.view
sales.refund
inventory.view
inventory.adjust
customers.create
customers.view
reports.financial.view
users.manage
```

Permissions should describe actions rather than screens.

A permission should answer:

> "What can this actor do?"

not:

> "Which page can this actor open?"

---

# 10. Scope

Permission alone is not always enough.

A user may have permission to perform an action but only within a specific area of the business.

Example:

```text
Jane
Role: Branch Manager
Permission: inventory.view
Scope: Embu Branch
```

Jane may see:

```text
Embu stock       YES
Nairobi stock    NO
```

Therefore authorization must consider:

```text
Identity
+
Business
+
Permission
+
Scope
```

---

# 11. Branch

## Definition

A Branch represents an operational unit of a Business.

Example:

```text
ABC Hardware
|
+-- Nairobi Branch
+-- Embu Branch
+-- Meru Branch
```

A branch may have:

* Users
* Locations
* Registers
* Inventory
* Sales
* Customers
* Operational configuration

Not every business needs multiple branches.

---

# 12. Location

## Definition

A Location represents a physical or logical place where something is stored or operated.

Examples:

```text
Shop
Warehouse
Store Room
Office
Stock Room
Service Area
```

A business may have:

```text
Business
|
+-- Branch
     |
     +-- Shop
     +-- Warehouse
```

Location should remain generic enough to support different industries.

---

# 13. Party

## Definition

A Party represents an entity that participates in business relationships.

A Party can be:

```text
Person
Organization
```

The same Party may have different roles.

Example:

```text
ABC Suppliers Ltd
|
+-- Supplier to Business A
|
+-- Customer of Business B
```

The Party itself represents the real-world entity.

The relationship with a particular Business determines what that entity means within that business.

---

# 14. Customer

## Definition

A Customer is a business relationship with a Party.

This distinction is important.

A person is not inherently a "customer."

They become a customer because a Business has a customer relationship with them.

Conceptually:

```text
Party
   |
   +-- Business Relationship
           |
           +-- Customer
```

A customer may have:

* Purchase history
* Invoices
* Payments
* Credit
* Loyalty
* Notes
* Communications
* Appointments
* Follow-ups

---

# 15. Supplier

A Supplier is another business relationship with a Party.

Example:

```text
Party
 |
 +-- Supplier Relationship
        |
        +-- Purchase Orders
        +-- Goods Received
        +-- Supplier Invoices
        +-- Payments
```

A Party may simultaneously be:

```text
Customer
+
Supplier
```

There should be no requirement to create duplicate Party identities.

---

# 16. Member

A Member represents a specialized relationship between a Party and a Business.

Examples:

```text
SACCO Member
Club Member
Association Member
```

Member behavior should be implemented by the relevant domain rather than forcing every Tawala business to understand membership concepts.

The generic Party model should still be reusable.

---

# 17. Employee

An Employee represents a person's working relationship with a Business.

An employee may also be a Tawala User.

However:

```text
Employee != User
```

A person may be:

```text
Employee
```

without having access to Tawala.

A Tawala User may also participate in a business without being modeled as an employee.

The exact relationship between employment and identity belongs to the relevant domain.

---

# 18. Product

## Definition

A Product represents something a business can buy, sell, stock, or otherwise manage.

Examples:

```text
Cement
Shampoo
Medicine
Phone
Food
Clothing
```

A Product may have:

* Name
* SKU
* Barcode
* Category
* Unit
* Pricing
* Cost
* Tax configuration
* Inventory configuration
* Supplier relationships

---

# 19. Product Does Not Mean Inventory

This distinction is fundamental.

A Product describes **what the thing is**.

Inventory describes **how much of that thing exists at a location**.

For example:

```text
Product:
Cement 50kg

Inventory:
Nairobi Warehouse → 500 bags
Embu Branch      → 120 bags
Meru Branch      → 80 bags
```

Therefore:

```text
Product != Stock
```

This allows Tawala to represent the same product across many locations.

---

# 20. Service

## Definition

A Service represents something a business provides that does not necessarily behave like physical inventory.

Examples:

```text
Haircut
Consultation
Repair
Installation
Cleaning
Training
```

A Service can participate in transactions just like a Product.

For example:

```text
Sale
|
+-- Product: Shampoo
+-- Service: Haircut
```

This is useful for businesses that sell both goods and services.

---

# 21. Resource

## Definition

A Resource represents something required to perform an operation.

Examples:

```text
Employee
Chair
Room
Machine
Vehicle
Equipment
Workstation
```

Resources are particularly useful for service-oriented domains.

Example:

```text
Appointment
|
+-- Customer
+-- Employee
+-- Chair
+-- Service
```

The Core provides the concept of a Resource.

Specialized domains decide how resources are scheduled or consumed.

---

# 22. Category

A Category organizes things for easier management and reporting.

Examples:

```text
Electronics
Building Materials
Hair Products
Medicines
Food
Services
```

Categories should support business-specific organization.

Tawala should not impose one universal category hierarchy on every industry.

---

# 23. Document

A Document represents a formal business record.

Examples:

```text
Quote
Sales Order
Invoice
Receipt
Purchase Order
Goods Received Note
Credit Note
Debit Note
```

Documents usually have a lifecycle.

For example:

```text
Draft
  ↓
Issued
  ↓
Completed
```

or:

```text
Draft
  ↓
Issued
  ↓
Cancelled
```

The lifecycle depends on the document type.

---

# 24. Transaction

## Definition

A Transaction represents something that happened in the business.

Examples:

```text
Sale
Purchase
Payment
Refund
Expense
Stock Transfer
Stock Adjustment
```

A transaction is different from a document.

A document describes or records a business process.

A transaction represents an actual business event or action.

Some documents may lead to transactions.

---

# 25. Sale

A Sale represents a business providing products or services to a customer.

A Sale may involve:

```text
Business
Customer
Products
Services
Prices
Taxes
Discounts
Payment
Inventory
Documents
```

A completed sale may cause:

```text
Stock decreases
Revenue is recognized
Payment is recorded
Customer history updates
Accounting updates
Audit record created
```

---

# 26. Purchase

A Purchase represents a business acquiring goods or services from a supplier.

A purchase may involve:

```text
Business
Supplier
Products
Services
Costs
Taxes
Payment
Inventory
Documents
Accounting
```

A completed purchase may cause:

```text
Inventory increases
Supplier balance changes
Money changes
Accounting changes
Audit record created
```

---

# 27. Stock Movement

A Stock Movement represents a change in inventory.

Examples:

```text
Sale
Purchase Received
Transfer
Adjustment
Return
Stock Count
```

Instead of simply changing:

```text
quantity = 100
```

Tawala should be capable of understanding:

```text
100
↓
-5 Sale
↓
+50 Purchase
↓
-20 Transfer
↓
=125
```

This gives the system a history of why stock changed.

---

# 28. Stock Transfer

A Stock Transfer moves inventory from one location to another.

Example:

```text
Nairobi Warehouse
       |
       | 100 units
       ↓
Embu Branch
```

A transfer must identify:

```text
Source
Destination
Items
Quantities
Initiator
Status
Time
```

A transfer is not simply:

```text
source_stock -= quantity
destination_stock += quantity
```

It is a business transaction with an audit trail.

---

# 29. Payment

A Payment represents money being received or otherwise settled against an obligation.

Potential methods:

```text
Cash
M-PESA
Airtel Money
Bank
Card
Other
```

Payment should be generic.

M-PESA is an integration/payment method, not the definition of Payment.

---

# 30. Payment Allocation

A payment may need to be applied to one or more obligations.

Example:

```text
Customer pays KES 10,000
```

The money may settle:

```text
Invoice A → 6,000
Invoice B → 4,000
```

Therefore Payment and Invoice should not necessarily be treated as a simple one-to-one relationship.

The domain must be able to represent allocation.

---

# 31. Account

An Account represents a financial or organizational balance.

Possible examples:

```text
Cash Account
Bank Account
Customer Receivable
Supplier Payable
Expense Account
Revenue Account
```

The accounting domain will define the exact meaning and behavior of financial accounts.

The Core should avoid embedding accounting assumptions into unrelated domains.

---

# 32. Financial Entry

A Financial Entry represents a recorded financial effect.

A sale may produce financial consequences.

A payment may produce financial consequences.

An expense may produce financial consequences.

If Tawala implements full accounting, the accounting domain should maintain the authoritative financial representation of those effects.

Operational modules should not invent their own competing financial truth.

---

# 33. Expense

An Expense represents a business cost.

Examples:

```text
Rent
Electricity
Transport
Internet
Supplies
Maintenance
Salaries
```

An expense may involve:

```text
Business
Branch
Party
Payment
Account
Financial Entry
Document
```

Expenses should be connected to financial reporting.

---

# 34. Appointment

Appointment represents scheduled work or service.

Examples:

```text
Haircut booking
Doctor consultation
Repair appointment
Training session
```

Appointments are likely part of a Service/Scheduling domain rather than the universal Core.

However, they can use Core concepts:

```text
Customer
Service
Employee
Resource
Location
Payment
```

---

# 35. Task

A Task represents work that needs to be performed.

Examples:

```text
Follow up customer
Repair machine
Call supplier
Approve refund
Complete order
```

Tasks may support CRM, operations, service management, and automation.

Task behavior should remain generic.

---

# 36. Event

An Event represents something that happened in the system.

Examples:

```text
SaleCompleted
PaymentReceived
PurchaseReceived
StockTransferred
CustomerCreated
InvoiceCancelled
```

Events allow other domains to respond to business activity.

Example:

```text
SaleCompleted
|
+-- Inventory
+-- Accounting
+-- CRM
+-- Loyalty
+-- Reporting
+-- Audit
```

---

# 37. Event vs Transaction

These concepts must not be confused.

A Transaction represents a business operation.

An Event represents the fact that something happened.

Example:

```text
Transaction:
Sale

Event:
SaleCompleted
```

The transaction is the business operation.

The event announces a meaningful state change.

---

# 38. Audit Record

An Audit Record explains what happened from a security and accountability perspective.

An audit record should be capable of identifying:

```text
Who
What
When
Where
Which business
Which resource
What changed
Why
```

Example:

```text
Jane
cancelled Invoice INV-1032
inside Embu Branch
at 14:32

Previous state: Issued
New state: Cancelled
Reason: Customer return
```

Audit records should not be treated as ordinary application logs.

---

# 39. Configuration

Configuration represents business-specific behavior.

Examples:

```text
Currency
Tax settings
Invoice numbering
Receipt numbering
Payment methods
Inventory rules
Credit rules
Business terminology
```

Configuration belongs to the appropriate scope.

Possible scopes include:

```text
Platform
Business
Branch
Capability
User
```

However, configuration inheritance should be designed carefully to avoid unpredictable behavior.

---

# 40. Relationships

The most important relationships can be represented conceptually as:

```text
User
 |
 +-- Membership
       |
       +-- Business
             |
             +-- Branch
             |     |
             |     +-- Location
             |
             +-- Party
             |
             +-- Product
             |
             +-- Service
             |
             +-- Resource
             |
             +-- Documents
             |
             +-- Transactions
             |
             +-- Payments
             |
             +-- Accounts
             |
             +-- Events
             |
             +-- Audit
```

This is the basic business graph.

---

# 41. Business Relationship Graph

A more useful view is:

```text
                         BUSINESS
                            |
          +-----------------+-----------------+
          |                 |                 |
        PEOPLE            THINGS            PLACES
          |                 |                 |
        Party            Product          Branch
          |               Service            |
     +----+----+          Resource         Location
     |    |    |
 Customer Supplier Employee
     |
     +-----------------------------+
     |                             |
   Sales                         CRM
     |
     +-----------+
                 |
              Payment
                 |
             Accounting
```

The same underlying entities participate in multiple domains.

That is intentional.

---

# 42. Domain Ownership

Not every concept belongs to Core.

A useful distinction is:

## Core

Concepts required to establish the platform and generic business context.

Potential Core concepts:

```text
Business
User
Membership
Role
Permission
Branch
Location
Party
Product
Service
Resource
Document
Transaction
Payment
Event
Audit
Configuration
```

These remain candidates until further architectural review.

---

## Domain Modules

Specialized concepts should belong to domain modules.

Examples:

```text
Sales
Quotes
Invoices
Returns

Inventory
Stock
Transfers
Batches
Expiry
Serial Numbers

CRM
Customer Profiles
Follow-ups
Communications
Campaigns

Accounting
Chart of Accounts
Journal Entries
Financial Statements

Scheduling
Appointments
Calendars
Availability

Loyalty
Points
Rewards
Programs

SACCO
Membership
Loans
Contributions
Guarantors

Pharmacy
Prescriptions
Drug Batches
Dispensing
```

The exact boundaries will be refined later.

---

# 43. Core vs Domain Test

Whenever a new concept is proposed for Core, ask:

> Can this concept exist meaningfully across many industries?

Test it against:

```text
Pharmacy
Hardware
Kinyozi
Restaurant
SACCO
Wholesale
Distribution
Professional Services
```

If the concept is useful across many domains:

```text
Strong Core candidate
```

If it is specific to a particular business domain:

```text
Domain module candidate
```

If it is only needed by one specialized workflow:

```text
Keep it out of Core
```

---

# 44. Industry Test

## Pharmacy

The model should be able to represent:

```text
Party
Product
Supplier
Location
Inventory
Sale
Payment
```

with specialized pharmacy capabilities such as:

```text
Batch
Expiry
Prescription
Dispensing
```

---

## Kinyozi

The model should be able to represent:

```text
Party
Service
Employee
Resource
Appointment
Payment
```

without requiring pharmacy or retail concepts.

---

## Hardware

The model should support:

```text
Product
Supplier
Inventory
Purchase
Sale
Customer
Payment
Branch
```

---

## Restaurant

The model should support:

```text
Product
Service
Sale
Customer
Payment
Location
Resource
```

with restaurant-specific capabilities added separately.

---

## SACCO

The model should support:

```text
Party
Member
Account
Payment
Transaction
Business
User
```

while specialized SACCO functionality handles:

```text
Loans
Contributions
Guarantors
Savings
Interest
```

---

# 45. Multi-Industry Business

A single user may operate businesses in completely different industries.

Example:

```text
User
|
+-- Business A
|     Pharmacy
|
+-- Business B
|     Kinyozi
|
+-- Business C
      Hardware
```

Each business has its own:

```text
Data
Users
Roles
Permissions
Configuration
Capabilities
Branches
Customers
Products
Financial records
```

There is no requirement for the businesses to share data.

---

# 46. Cross-Business Data

By default:

```text
Business A ≠ Business B
```

Even when the same user controls both businesses.

The platform should not accidentally merge:

```text
Customers
Products
Sales
Inventory
Payments
Reports
```

across businesses.

If a future feature intentionally supports cross-business operations, it must be explicitly designed and authorized.

It should never happen as a side effect.

---

# 47. Lifecycle Principles

Important domain objects should have explicit lifecycles.

Example:

```text
Document
Draft
  ↓
Issued
  ↓
Completed
```

or:

```text
Transaction
Created
  ↓
Confirmed
  ↓
Completed
```

or:

```text
Membership
Pending
  ↓
Active
  ↓
Suspended
  ↓
Revoked
```

Objects should not disappear simply because they are no longer active.

Historical business records are valuable.

---

# 48. Deletion Principles

Deletion must be treated carefully.

For ordinary reference data, deletion may sometimes be appropriate.

For historical business records:

```text
Sales
Invoices
Payments
Financial records
Stock movements
Audit records
```

hard deletion should generally not be the default behavior.

Instead, the system should prefer appropriate lifecycle operations such as:

```text
Cancel
Void
Reverse
Archive
Deactivate
```

This preserves business history.

---

# 49. Business Truth

The domain model should distinguish between:

```text
Current State
```

and:

```text
History
```

For example:

Current inventory:

```text
Cement = 120
```

History:

```text
+200 Purchase
-50 Sale
-30 Transfer
```

The current state answers:

> "What is true now?"

The history answers:

> "How did we get here?"

Tawala needs both.

---

# 50. Business Operation Example

Consider:

```text
Customer buys 3 products.
```

The conceptual process is:

```text
Customer
   |
   +-- Sale
         |
         +-- Product A
         +-- Product B
         +-- Product C
         |
         +-- Payment
```

Completion may produce:

```text
SaleCompleted
|
+-- Inventory decreases
+-- Customer history updates
+-- Payment recorded
+-- Accounting updated
+-- Loyalty updated
+-- Reporting updated
+-- Audit created
```

The sale is therefore a central business operation connecting multiple domains.

---

# 51. Another Example: Purchasing

```text
Supplier
   |
   +-- Purchase
         |
         +-- Product A
         +-- Product B
         |
         +-- Payment
```

Completion may produce:

```text
PurchaseReceived
|
+-- Inventory increases
+-- Supplier balance updates
+-- Accounting updates
+-- Reporting updates
+-- Audit created
```

Again, one business action can affect many areas.

---

# 52. Another Example: Stock Transfer

```text
Nairobi Warehouse
       |
       | Transfer
       |
       ↓
Embu Branch
```

The system should record:

```text
Source
Destination
Products
Quantities
Actor
Time
Status
Reason
```

The resulting event might be:

```text
StockTransferred
```

Other domains can react to that event.

---

# 53. Another Example: Customer Credit

A customer may receive goods before paying.

Conceptually:

```text
Sale
 |
 +-- Invoice
 |
 +-- Outstanding Balance
```

Later:

```text
Payment
 |
 +-- Allocated to Invoice
 |
 +-- Outstanding Balance decreases
```

The system should not represent credit as merely:

```text
customer.credit = 5000
```

without understanding where that balance came from.

Credit is a business relationship involving transactions and obligations.

---

# 54. Domain Boundaries

The domain model should eventually produce boundaries similar to:

```text
                  TAWALA CORE
                       |
       +---------------+---------------+
       |               |               |
   Identity       Organization      Parties
       |               |               |
       +---------------+---------------+
                       |
             +---------+---------+
             |                   |
          Commerce           Operations
             |                   |
       Sales/Purchases       Inventory
             |
       +-----+-----+
       |           |
      CRM       Payments
                   |
               Accounting
```

These boundaries are conceptual and will be refined.

---

# 55. The Core Should Not Know Everything

The Core should know that:

```text
A Party exists.
A Product exists.
A Business exists.
A Location exists.
A Transaction exists.
A Payment exists.
A User has permissions.
```

It should not need to know every specialized rule.

For example, Core should not contain:

```text
Prescription validation
Haircut duration rules
SACCO loan calculations
Restaurant table management
Pharmacy dispensing rules
```

Those belong to specialized domains.

---

# 56. Domain Modules Should Reuse Core Concepts

Specialized domains should not reinvent foundational concepts.

For example:

Pharmacy should use:

```text
Party
Product
Location
Transaction
Payment
```

rather than creating:

```text
PharmacyCustomer
PharmacyProduct
PharmacyLocation
PharmacyPayment
```

unless there is a genuinely specialized concept.

The goal is reuse without forcing specialization into Core.

---

# 57. The Business Graph

Ultimately, Tawala represents a connected graph of business activity.

Example:

```text
                    BUSINESS
                       |
          +------------+------------+
          |            |            |
        PARTY       PRODUCT      LOCATION
          |            |            |
       CUSTOMER        |         BRANCH
          |            |            |
          +------------+------------+
                       |
                     SALE
                       |
          +------------+------------+
          |                         |
       PAYMENT                  INVENTORY
          |                         |
      ACCOUNTING                MOVEMENT
          |
        REPORT
```

This interconnectedness is one of Tawala's greatest strengths.

A business should not have to enter the same information repeatedly into separate systems.

---

# 58. Single Business Truth

The same business fact should have one authoritative representation.

For example:

If a customer buys something:

```text
Sales
CRM
Inventory
Payments
Accounting
Reporting
```

should ultimately derive their understanding from the same underlying business event.

They should not each create independent versions of the sale.

---

# 59. Domain Invariants

The domain model must protect important truths.

Examples:

### Identity

A User cannot access a Business without an authorized relationship.

### Isolation

One Business cannot access another Business's data by default.

### Inventory

Stock cannot move without identifying where it came from and where it went.

### Transactions

Completed business transactions cannot simply disappear.

### Payments

Payments must belong to an authorized business context.

### Documents

Cancelled documents remain historically visible.

### Authorization

A user cannot perform an operation solely because the client interface allows them to request it.

### Audit

Important business actions must remain traceable.

These rules will later become formal application and database constraints.

---

# 60. What We Are NOT Deciding Yet

This document intentionally does not decide:

```textDatabase tables
SQLModel classes
FastAPI routes
Next.js architecture
Authentication implementation
JWT structure
PostgreSQL schema
Message broker
Event bus technology
Cloud infrastructure
Desktop framework
Mobile framework
Offline synchronization
```

Those are implementation decisions.

The domain model comes first.

---

# 61. Provisional Core Vocabulary

The current candidate Core vocabulary is:

```text
Business
User
Membership
Role
Permission
Branch
Location
Party
Product
Service
Resource
Document
Transaction
Payment
Event
Audit Record
Configuration
```

This is a **candidate vocabulary**, not a final schema.

Every concept must survive further analysis.

---

# 62. Questions We Must Resolve Next

Before implementing the model, we need to answer:

1. Is `Party` actually the correct abstraction?
2. Should Customer/Supplier/Employee/Member be relationships, profiles, or separate entities?
3. What exactly owns a Branch?
4. What exactly is a Location?
5. Is Product truly Core?
6. Should Service share a model with Product?
7. What exactly is a Transaction?
8. How do Documents relate to Transactions?
9. What exactly does Payment settle?
10. How should financial obligations be represented?
11. Where does Inventory belong?
12. Which concepts are aggregates?
13. Which objects own other objects?
14. Which operations must be atomic?
15. Which concepts belong in Core versus modules?
16. What must be immutable?
17. What can be cancelled or reversed?
18. What constitutes a business event?
19. What must be auditable?
20. What data must never cross tenant boundaries?

These questions become the next engineering work.

---

# 63. Domain Model Acceptance Criteria

The model should be considered successful only if it can represent, without changing the Core:

```text
A small retail shop
A multi-branch retailer
A pharmacy
A hardware store
A kinyozi
A salon
A restaurant
A wholesaler
A distributor
A professional service business
A SACCO
```

It must also support:

```text
One user → multiple businesses
One business → multiple branches
One business → multiple users
One business → multiple industries/capabilities
One product → multiple locations
One party → multiple relationships
One transaction → multiple consequences
One client → multiple interfaces
```

---

# 64. Architectural Test

The strongest test of the domain model is this:

> **Can we introduce a new industry without rewriting the Core?**

For example, imagine Tawala has never supported salons.

We should be able to introduce:

```text
Salon Domain
```

using existing concepts:

```text
Party
Service
Employee
Resource
Location
Appointment
Payment
Transaction
```

plus salon-specific concepts where necessary.

If adding a salon requires changing the meaning of:

```text
Business
Party
Product
Transaction
Payment
```

then our Core is probably too industry-specific.

---

# 65. Final Domain Principle

The objective is not to model every business in advance.

That is impossible.

The objective is to model the **common language of business operations** well enough that specialized industries can build on it.

Therefore:

> **Tawala Core should provide the nouns and fundamental rules. Domain modules provide specialized behavior.**

In simple terms:

```text
CORE
"What exists?"

DOMAIN
"How does this industry use it?"

CLIENT
"How does the user interact with it?"
```

---

# 66. Current Conceptual Architecture

The current model can be summarized as:

```text
                           TAWALA
                              |
                         BUSINESS
                              |
          +-------------------+-------------------+
          |                   |                   |
       IDENTITY          ORGANIZATION          PARTIES
          |                   |                   |
       User              Branch/Location      Customer
       Membership                             Supplier
       Role                                   Employee
       Permission                             Member
          |                   |                   |
          +-------------------+-------------------+
                              |
                     PRODUCTS / SERVICES
                              |
                     DOCUMENTS / TRANSACTIONS
                              |
             +----------------+----------------+
             |                |                |
           SALES          PURCHASING       OPERATIONS
             |                |                |
             +----------------+----------------+
                              |
                         PAYMENTS
                              |
                         ACCOUNTING
                              |
                           EVENTS
                              |
                           AUDIT
                              |
                         REPORTING
```

---

# 67. Status

This domain model is currently:

**PROPOSED**

It must not yet be treated as an implementation specification.

The next step is to challenge the model aggressively.

We should attempt to break it using real business scenarios before turning any of these concepts into database models.

---

# 68. Next Artifact

The next architectural artifact should be:

```text
TAWALA_SECURITY_MODEL.md
```

It will define:

```text
Authentication
Tenant Isolation
Membership
RBAC
Permissions
Scopes
Resource Authorization
Session Context
Service-to-Service Authorization
Audit
Data Access Boundaries
```

The security model is deliberately next because:

> **If we get tenancy and authorization wrong at the foundation, everything built above it becomes dangerous to retrofit.**

---

**END OF TAWALA_DOMAIN_MODEL.md**

````