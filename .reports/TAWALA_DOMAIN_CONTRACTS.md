😂😂 **ALRIGHT MF.**

We’re moving from **architecture → actual contracts**.

This is the document where Tawala stops being a collection of ideas and starts becoming a system that can be implemented without domains reaching into each other’s guts.

# `TAWALA_DOMAIN_CONTRACTS.md`

````md
# TAWALA DOMAIN CONTRACTS

**Version:** 1.0.0  
**Status:** Architecture Specification  
**Depends On:**
- TAWALA_CORE_ARCHITECTURE.md
- TAWALA_SECURITY_MODEL.md
- TAWALA_DOMAIN_BOUNDARIES.md

---

# 1. Purpose

This document defines how Tawala domains communicate.

The previous architecture documents answered:

> What is Tawala?

> What are its domains?

> Who owns what?

This document answers:

> How do those domains talk to each other without becoming tightly coupled?

The objective is to create explicit contracts between domains.

A domain should never need to understand another domain's internal implementation.

---

# 2. The Fundamental Rule

The most important rule in this document is:

> A domain may use another domain's capabilities, but it must not depend on that domain's internal implementation.

In practical terms:

```text
GOOD

Sales
  |
  ↓
Inventory Contract
  |
  ↓
Inventory
````

```text
BAD

Sales
  |
  ↓
Inventory SQLModel
  |
  ↓
Inventory Database Table
```

The first creates a boundary.

The second destroys one.

---

# 3. What Is a Contract?

A contract is an agreement between domains.

It defines:

```text
What can be requested
What data is required
What result is returned
What errors can occur
What events can be emitted
What guarantees exist
```

A contract does not care whether the underlying implementation uses:

```text
Python
TypeScript
PostgreSQL
Redis
Kafka
RabbitMQ
HTTP
Internal function calls
```

Those are implementation details.

---

# 4. Contract Types

Tawala uses four major contract types.

```text
1. Command Contracts
2. Query Contracts
3. Event Contracts
4. Integration Contracts
```

Each exists for a different purpose.

---

# 5. Command Contracts

A command means:

> Please perform this operation.

Examples:

```text
CreateSale
ReserveStock
TransferStock
ReceiveGoods
CreatePayment
CreateCustomer
CreatePurchaseOrder
```

Commands represent actions.

They should have:

```text
Command name
Actor/context
Tenant/business context
Input
Expected result
Failure conditions
```

---

# 6. Query Contracts

A query means:

> Give me information.

Examples:

```text
GetProduct
GetCustomer
GetStockLevel
GetCustomerBalance
GetSalesSummary
GetSupplier
```

Queries should not modify business state.

This creates a useful distinction:

```text
Command → changes state

Query → reads state
```

---

# 7. Event Contracts

An event means:

> Something already happened.

Examples:

```text
SaleCompleted
StockAdjusted
PaymentReceived
CustomerCreated
GoodsReceived
PurchaseOrderApproved
```

Events are facts.

They should be immutable.

Once:

```text
SaleCompleted
```

has happened, Tawala should not mutate the event into:

```text
SaleCancelled
```

Instead, a new event should represent the new fact.

---

# 8. Integration Contracts

Integration contracts are used when Tawala communicates outside itself.

Examples:

```text
M-PESA
SMS provider
Email provider
Accounting platform
Bank
Payment gateway
Barcode hardware
External CRM
```

These contracts protect the Tawala domain model from external systems.

---

# 9. Contract Ownership

Every contract has an owner.

For example:

```text
Inventory owns:

ReserveStock
ReleaseStock
TransferStock
StockAdjusted
StockReserved
StockReleased
StockTransferred
```

Sales should not define Inventory's contracts.

It consumes them.

Likewise:

```text
Payments owns:

CreatePayment
RefundPayment
PaymentReceived
PaymentRefunded
```

---

# 10. Contract Ownership Rule

> The domain that owns a capability owns the contract describing that capability.

This prevents consumers from defining what another domain should do.

---

# 11. Tenant Context

Every business operation must carry sufficient tenant context.

Conceptually:

```text
TenantContext
|
+-- tenant_id
+-- business_id
+-- actor_id
+-- branch_id
+-- permissions/scope
+-- request_id
```

The exact structure can evolve.

The principle cannot.

A domain operation must know:

> On whose behalf is this operation happening?

---

# 12. Tenant Isolation

No domain contract may allow an actor to operate outside its authorized tenant.

For example:

```text
Business A
    |
    +-- Sale A1
    +-- Customer A1
    +-- Stock A1
```

must never accidentally resolve:

```text
Business B
    |
    +-- Customer B1
```

through a missing or incorrect tenant scope.

Tenant context is part of the architecture, not an optional filter.

---

# 13. Authorization

Contracts do not replace authorization.

A request flows conceptually through:

```text
Request
  |
Identity
  |
Tenant Context
  |
Authorization
  |
Domain Contract
  |
Domain Rules
```

Both security and business rules must pass.

---

# 14. Actor vs Owner

The actor performing an operation is not necessarily the owner of the data.

Example:

```text
Business Owner
    |
    +-- Cashier creates Sale
```

The cashier is:

```text
actor
```

The business is:

```text
owner / tenant
```

Contracts must preserve this distinction.

---

# 15. Request Identity

Every cross-domain operation should be traceable.

Conceptually:

```text
request_id
```

should travel through the operation.

For asynchronous events, an event should also carry enough metadata to correlate it with the originating request.

This becomes extremely useful for:

```text
Debugging
Audit
Observability
Incident investigation
```

---

# 16. Command Structure

A conceptual command looks like:

```text
CreateSale
|
+-- tenant_context
+-- customer_id
+-- branch_id
+-- items
+-- pricing information
+-- payment instructions
+-- metadata
```

The exact schema is defined later.

The important point is that commands carry business intent.

---

# 17. Commands Should Express Intent

Prefer:

```text
ReserveStock
```

over:

```text
UpdateInventoryQuantity
```

Prefer:

```text
CompleteSale
```

over:

```text
SetSaleStatus
```

Prefer:

```text
ReceiveGoods
```

over:

```text
IncreaseStock
```

The first versions express business intent.

The second versions expose implementation details.

---

# 18. Query Contracts

Queries should describe what the caller needs.

Examples:

```text
GetAvailableStock
GetCustomerProfile
GetProductDetails
GetOutstandingBalance
GetSalesSummary
```

A query should not require the consumer to know how the data is stored.

---

# 19. Query Results

A query result should be a contract.

For example:

```text
GetAvailableStock
        |
        ↓

StockAvailability
|
+-- product_id
+-- location_id
+-- available_quantity
+-- reserved_quantity
+-- status
```

The caller does not need to know whether this came from:

```text
PostgreSQL
Redis
cache
materialized view
inventory projection
```

---

# 20. Event Structure

Every domain event should contain common metadata.

Conceptually:

```text
DomainEvent
|
+-- event_id
+-- event_type
+-- occurred_at
+-- tenant_id
+-- actor_id
+-- request_id
+-- aggregate_id
+-- aggregate_type
+-- version
+-- payload
```

The exact implementation is intentionally deferred.

---

# 21. Event Immutability

Events represent historical facts.

Therefore:

```text
Event
    ↓
Published
    ↓
Immutable
```

If something changes later:

```text
SaleCompleted
      ↓
SaleReturned
```

do not modify the original event.

Publish the new fact.

---

# 22. Event Ordering

Consumers should not blindly assume that events will always arrive perfectly ordered.

For important aggregates, events should carry enough information to detect:

```text
duplicate events
out-of-order events
stale events
```

This becomes particularly important once asynchronous processing is introduced.

---

# 23. Idempotency

Commands and event consumers should be designed with duplicate delivery in mind.

For example:

```text
PaymentReceived
PaymentReceived
```

must not accidentally create:

```text
KES 1,000
+
KES 1,000
=
KES 2,000
```

when the original payment was only KES 1,000.

The consumer should be able to recognize:

> I have already processed this event.

---

# 24. Idempotency Keys

Operations that can safely be retried should support idempotency.

Examples:

```text
CreatePayment
CreateSale
RefundPayment
ReceiveGoods
```

Conceptually:

```text
idempotency_key
```

identifies one logical operation.

Retrying the same operation should not create a second business transaction.

---

# 25. Inventory Contract

Inventory owns physical stock.

Its major contracts include:

```text
CheckStock
ReserveStock
ReleaseStock
CommitStock
TransferStock
AdjustStock
ReceiveStock
```

Possible events:

```text
StockReserved
StockReleased
StockCommitted
StockTransferred
StockAdjusted
StockReceived
```

---

# 26. Sales → Inventory

Sales may request:

```text
ReserveStock
```

The Inventory domain decides:

```text
Is the stock available?
Is the location valid?
Is the product stock-managed?
Are the requested quantities valid?
```

Sales does not answer these questions.

---

# 27. Inventory → Sales

Inventory should not directly manipulate a Sale.

Instead, Inventory communicates facts.

For example:

```text
StockReservationFailed
```

or:

```text
StockCommitted
```

Sales decides what those facts mean for its workflow.

---

# 28. Catalog Contract

Catalog owns products and services.

Example contracts:

```text
CreateProduct
UpdateProduct
GetProduct
SearchProducts
CreateVariant
UpdatePricing
```

Possible events:

```text
ProductCreated
ProductUpdated
ProductArchived
PriceChanged
```

---

# 29. Inventory and Catalog

Inventory references Catalog identities.

Conceptually:

```text
Catalog
 |
Product ID
 |
Inventory
```

Inventory should not recreate the complete Product model.

It needs only the information required for inventory operations.

---

# 30. Sales and Catalog

Sales can request:

```text
GetProduct
```

or a suitable pricing/product snapshot.

A completed sale should preserve the relevant transactional information.

This is important because product information may change later.

For example:

```text
Product price today:
KES 500

Product price next month:
KES 650
```

The historical sale must remain accurate.

---

# 31. CRM Contract

CRM owns customers and relationships.

Example commands:

```text
CreateCustomer
UpdateCustomer
AddCustomerNote
RecordInteraction
```

Queries:

```text
GetCustomer
SearchCustomers
GetCustomerHistory
GetCustomerCreditProfile
```

Events:

```text
CustomerCreated
CustomerUpdated
CustomerInteractionRecorded
```

---

# 32. Sales → CRM

Sales may request customer information.

For example:

```text
GetCustomer
```

But Sales does not modify CRM data directly.

If Sales needs to update customer-related information, it uses a CRM contract.

---

# 33. Purchasing Contract

Purchasing owns procurement.

Example commands:

```text
CreatePurchaseOrder
ApprovePurchaseOrder
ReceiveGoods
ReturnPurchase
```

Queries:

```text
GetPurchaseOrder
GetSupplier
GetOpenPurchaseOrders
```

Events:

```text
PurchaseOrderCreated
PurchaseOrderApproved
GoodsReceived
PurchaseReturned
```

---

# 34. Purchasing → Inventory

When goods are received:

```text
Purchasing
    |
GoodsReceived
    |
Inventory
```

Inventory determines the actual stock movement.

Purchasing records the procurement event.

---

# 35. Payments Contract

Payments owns payment transactions.

Commands:

```text
CreatePayment
AllocatePayment
RefundPayment
ReversePayment
ReconcilePayment
```

Queries:

```text
GetPayment
GetPaymentStatus
GetCustomerPayments
GetUnallocatedPayments
```

Events:

```text
PaymentCreated
PaymentReceived
PaymentAllocated
PaymentRefunded
PaymentReversed
PaymentReconciled
```

---

# 36. Sales → Payments

Sales may request:

```text
CreatePayment
```

or initiate a payment workflow.

Payments owns:

```text
payment identity
payment status
payment method
payment references
provider interaction
refund state
```

Sales owns:

```text
sale state
amount due
transaction status
```

---

# 37. Payment Provider Boundary

M-PESA or another provider must not become part of the Sales domain.

Instead:

```text
Sales
 |
Payments
 |
Payment Provider Adapter
 |
M-PESA
```

This means Tawala can eventually support:

```text
M-PESA
Card
Bank
Cash
Other gateways
```

without rewriting Sales.

---

# 38. Accounting Contract

Accounting owns financial representation.

Potential commands:

```text
RecordExpense
CreateJournalEntry
CloseFinancialPeriod
ReconcileAccount
```

Queries:

```text
GetAccountBalance
GetFinancialSummary
GetReceivables
GetPayables
GetProfitAndLoss
```

Events:

```text
JournalEntryRecorded
ExpenseRecorded
AccountReconciled
FinancialPeriodClosed
```

---

# 39. Sales → Accounting

Sales may publish:

```text
SaleCompleted
```

Accounting consumes that fact.

Accounting determines the appropriate financial treatment.

Sales should not create accounting journal entries itself.

---

# 40. Payments → Accounting

Payments publishes:

```text
PaymentReceived
PaymentRefunded
PaymentReversed
```

Accounting consumes these facts and applies financial rules.

---

# 41. Inventory → Accounting

Inventory may publish:

```text
StockReceived
StockAdjusted
StockSold
StockWrittenOff
```

Accounting can consume these events where inventory has financial consequences.

This allows accounting to evolve independently from physical stock management.

---

# 42. Reporting Contracts

Reporting primarily consumes events and builds read models.

It should not require every operational domain to expose internal tables.

Example:

```text
SaleCompleted
PaymentReceived
StockAdjusted
PurchaseReceived
```

can feed reporting projections.

---

# 43. Reporting Queries

Reporting may expose:

```text
GetSalesDashboard
GetInventoryDashboard
GetProfitSummary
GetBranchPerformance
GetCashierPerformance
GetProductPerformance
```

These are read contracts.

They should be optimized for reporting needs.

---

# 44. Audit Contracts

Audit records important actions.

It may consume:

```text
SaleCompleted
SaleReturned
PaymentRefunded
StockAdjusted
RoleChanged
UserInvited
BusinessUpdated
```

Audit should preserve:

```text
Who
What
When
Where
Which tenant
Which resource
Which request
```

---

# 45. Audit Is Append-Oriented

Audit records should generally be append-oriented.

Instead of:

```text
Change audit record
```

prefer:

```text
Original action
+
Correction action
```

This preserves historical truth.

---

# 46. Notification Contract

Notifications should expose delivery capabilities.

Examples:

```text
SendNotification
SendSMS
SendEmail
SendPushNotification
```

But the Notification domain should not decide:

```text
When stock is low
When an invoice is overdue
When a customer should be contacted
```

Those are business rules.

---

# 47. Automation Contract

Automation consumes business events.

Example:

```text
StockLevelChanged
       |
       ↓
Automation Rule
       |
       ↓
SendNotification
```

Automation can therefore evolve without embedding itself inside Inventory.

---

# 48. Security Contract

Security provides authorization decisions.

Conceptually:

```text
CanPerformAction
```

Inputs may include:

```text
actor
tenant
resource
action
scope
```

Result:

```text
Allowed
```

or:

```text
Denied
```

The domain still enforces its own business rules after authorization.

---

# 49. Security Is Not Business Logic

Security can answer:

```text
"Can this cashier create a refund?"
```

But it should not answer:

```text
"Is this refund financially valid?"
```

The latter belongs to the relevant business domain.

---

# 50. Organization Contract

Organization provides business structure.

Examples:

```text
CreateBusiness
CreateBranch
UpdateBranch
CreateLocation
```

Queries:

```text
GetBusiness
GetBranch
ListBranches
GetLocation
```

Events:

```text
BusinessCreated
BranchCreated
BranchUpdated
LocationCreated
```

---

# 51. Cross-Domain References

Domains should reference entities using stable identifiers.

Example:

```text
customer_id
product_id
branch_id
location_id
sale_id
payment_id
```

A domain does not need to copy the entire entity.

It stores the identity it needs.

---

# 52. Snapshot Data

Sometimes a domain needs historical information that must not change.

In those cases, a snapshot may be appropriate.

Example:

```text
Sale
 |
Product snapshot
 |
name
sku
unit price
tax information
```

This is different from creating a second authoritative Product entity.

The snapshot exists to preserve historical transaction truth.

---

# 53. Reference vs Snapshot

Use a reference when:

```text
The current identity matters.
```

Use a snapshot when:

```text
Historical state must remain unchanged.
```

Example:

```text
customer_id
```

may reference CRM.

But the customer's billing details at the time of an invoice may require a historical snapshot.

---

# 54. Contract Versioning

Contracts will evolve.

Therefore, contracts should be versionable.

Conceptually:

```text
SaleCompleted.v1
SaleCompleted.v2
```

Evolution should avoid breaking existing consumers unnecessarily.

---

# 55. Backward Compatibility

When possible:

```text
Old consumer
      |
      ↓
Old contract
```

should continue working while:

```text
New consumer
      |
      ↓
New contract
```

is introduced.

This becomes important for:

```text
Desktop
Mobile
Web
External integrations
Background workers
```

---

# 56. Client Contracts

The Desktop, Web, and Mobile applications should consume stable API contracts.

They should not depend on:

```text
database schemas
ORM models
internal domain classes
```

Instead:

```text
Desktop
   |
API Contract
   |
Tawala
```

and:

```text
Mobile
   |
API Contract
   |
Tawala
```

---

# 57. Hardware Contracts

Hardware is also treated as an integration boundary.

For example:

```text
BarcodeScanner
 |
scan()
 |
product identifier
```

The desktop application converts that hardware interaction into a Tawala operation:

```text
SearchProducts
```

The Sales domain never needs to know which scanner produced the barcode.

---

# 58. Offline Contracts

If Tawala eventually supports offline operation, commands become especially important.

The client may record:

```text
CreateSale
```

locally.

Later:

```text
Offline command
      |
      ↓
Synchronization
      |
      ↓
Tawala API
```

This makes offline support an architectural concern rather than a special implementation hack.

---

# 59. Integration Events

Internal domain events and external integration events should be conceptually separated.

Internal:

```text
SaleCompleted
```

External:

```text
ExternalSaleNotification
```

The integration layer translates between Tawala's internal model and external provider formats.

---

# 60. Never Leak Provider Models

Do not allow an external provider's model to become a Tawala domain model.

Bad:

```text
M-PESAResponse
```

everywhere inside Payments.

Better:

```text
PaymentResult
```

inside Tawala.

The M-PESA adapter translates:

```text
M-PESA response
      ↓
Tawala PaymentResult
```

---

# 61. Error Contracts

Cross-domain operations must use predictable error categories.

Examples:

```text
NotFound
Unauthorized
Forbidden
ValidationFailed
Conflict
AlreadyProcessed
InsufficientStock
InvalidState
ExternalServiceUnavailable
```

The exact error implementation comes later.

The semantic categories should remain stable.

---

# 62. Domain Errors vs Infrastructure Errors

A domain error:

```text
InsufficientStock
```

is a business condition.

An infrastructure error:

```text
DatabaseUnavailable
```

is a technical condition.

Do not expose raw infrastructure failures as business errors.

---

# 63. Error Translation

External provider errors should be translated.

For example:

```text
M-PESA:
"ResultCode 1037"
```

should not leak throughout Tawala.

Instead:

```text
PaymentProviderUnavailable
```

or another appropriate domain-level error can be exposed.

---

# 64. Contract Security

Contracts must assume inputs are untrusted.

Every contract boundary must validate:

```text
Identity
Tenant
Authorization
Input
State
References
Idempotency
```

Do not rely on the caller being trustworthy simply because the caller is another internal module.

---

# 65. Contract Validation

Contract validation should happen before domain logic executes.

Conceptually:

```text
Input
 |
Schema validation
 |
Authorization
 |
Domain validation
 |
Operation
```

This prevents malformed requests from reaching business logic.

---

# 66. Transaction Boundaries

Contracts should make transaction boundaries explicit.

For example:

```text
CreateSale
```

may require one atomic business operation.

But:

```text
SendSMS
```

does not need to participate in that transaction.

This distinction prevents unnecessary coupling.

---

# 67. The Outbox Principle

When a domain changes its state and must publish an event, Tawala should eventually use a reliable mechanism such as an outbox pattern.

Conceptually:

```text
Database Transaction
       |
       +-- Business Change
       |
       +-- Event Record
```

Then:

```text
Outbox
  |
  ↓
Event Delivery
```

This prevents the dangerous situation where:

```text
Database update succeeds
Event publishing fails
```

and the system loses the event.

---

# 68. Event Delivery

Event delivery should assume:

```text
Messages may be retried.
Consumers may be temporarily unavailable.
A message may arrive more than once.
```

Therefore:

```text
At-least-once delivery
+
Idempotent consumers
```

is a strong default architecture.

---

# 69. Do Not Require Perfect Delivery

A notification failure should not normally break a sale.

For example:

```text
SaleCompleted
 |
 +----→ Accounting
 +----→ Reporting
 +----→ Audit
 +----→ Notification
```

If Notification is unavailable:

```text
Sale remains completed.
```

The notification can be retried.

---

# 70. Critical vs Non-Critical Contracts

Every cross-domain operation should be classified.

## Critical

The operation is required to complete the business transaction.

Example:

```text
Validate/Reserve Stock
```

## Non-Critical

The operation can happen later.

Example:

```text
Send notification
Update analytics
Generate dashboard projection
```

This distinction determines whether the interaction should be synchronous or asynchronous.

---

# 71. Domain Contract Matrix

| Domain        | Commands                   | Queries           | Events              |
| ------------- | -------------------------- | ----------------- | ------------------- |
| Catalog       | Product operations         | Product lookup    | ProductChanged      |
| CRM           | Customer operations        | Customer lookup   | CustomerChanged     |
| Sales         | Sale operations            | Sales lookup      | Sale events         |
| Inventory     | Stock operations           | Stock lookup      | Stock events        |
| Purchasing    | Procurement operations     | Purchase lookup   | Procurement events  |
| Payments      | Payment operations         | Payment lookup    | Payment events      |
| Accounting    | Financial operations       | Financial reports | Accounting events   |
| Organization  | Business/branch operations | Structure lookup  | Organization events |
| Security      | Authorization operations   | Permission lookup | Security events     |
| Reporting     | Projection refresh         | Dashboard queries | Reporting events    |
| Audit         | —                          | Audit lookup      | Audit records       |
| Notifications | Delivery commands          | Delivery status   | Delivery events     |
| Automation    | Rule operations            | Rule lookup       | Automation events   |

---

# 72. Example: Complete Checkout

A checkout could conceptually look like:

```text
Client
  |
  ↓
Checkout Command
  |
  ↓
Sales
  |
  +----→ Catalog
  |
  +----→ Inventory
  |
  +----→ Payments
  |
  ↓
SaleCompleted
  |
  +----→ Accounting
  +----→ Reporting
  +----→ Audit
  +----→ Automation
  +----→ Notifications
```

The important point:

> The checkout workflow coordinates domains without owning their internals.

---

# 73. What the Client Knows

The client needs to know:

```text
What actions are available
What data to submit
What result to expect
What errors may occur
```

The client should not know:

```text
Which repository was used
Which database table was touched
How stock is stored
How accounting journals are generated
How events are transported
```

---

# 74. What a Domain Knows

A domain knows:

```text
Its own rules
Its own state
Its own contracts
Its allowed dependencies
Its events
```

It should not know:

```text
Which UI triggered the operation
Which hardware produced the input
Which dashboard consumes its events
Which SMS provider is being used
```

---

# 75. What the Platform Knows

The platform provides:

```text
Identity
Tenant context
Security
Configuration
Observability
Event infrastructure
Persistence infrastructure
Integration infrastructure
```

But it should not own business rules belonging to domains.

---

# 76. Contract Dependency Graph

The conceptual dependency graph becomes:

```text
                  PLATFORM
                     |
          +----------+----------+
          |                     |
       Security             Organization
          |                     |
          +----------+----------+
                     |
             BUSINESS DOMAINS
                     |
       +-------------+-------------+
       |             |             |
     Catalog       CRM           Sales
       |             |             |
       |             |        +----+----+
       |             |        |         |
       |             |    Inventory   Payments
       |             |        |         |
       +-------------+--------+---------+
                            |
                       Purchasing
                            |
                        Accounting
                            |
                    Reporting / Audit
                            |
                  Notifications / Automation
```

This is conceptual.

The implementation can evolve without changing the fundamental contracts.

---

# 77. What Domains Must Never Do

A domain must not:

```text
1. Directly modify another domain's database records.

2. Import another domain's internal ORM models.

3. Depend on another domain's private classes.

4. Assume another domain's database structure.

5. Embed external provider logic.

6. Perform unauthorized cross-tenant lookups.

7. Bypass authorization.

8. Modify historical events.

9. Treat notifications as required for unrelated transactions.

10. Make frontend state authoritative over backend business state.
```

---

# 78. The Contract Test

Before introducing a dependency between two domains, ask:

```text
Why does this dependency exist?

Who owns the capability?

Is this a command, query, or event?

Can the consumer depend on a contract instead of implementation?

What happens if the provider is unavailable?

Is the operation synchronous or asynchronous?

Is it idempotent?

What tenant context is required?

Who authorizes it?

Who owns the resulting state?
```

If these questions cannot be answered clearly, the contract is not ready.

---

# 79. Contract Design Philosophy

Tawala contracts should be:

```text
Explicit
Small
Stable
Versionable
Business-oriented
Tenant-aware
Secure
Observable
Idempotent where necessary
Independent of implementation
```

They should not be:

```text
ORM-shaped
Database-shaped
Provider-shaped
UI-shaped
Overly generic
```

---

# 80. The Ultimate Boundary

The deepest architectural rule is:

> **A domain should be replaceable without requiring the rest of Tawala to understand how it works internally.**

For example:

```text
Inventory v1
```

could eventually become:

```text
Inventory v2
```

or:

```text
Inventory Service
```

while consumers continue using the same contracts.

That is the real value of the architecture.

---

# 81. Implementation Direction

Once these contracts are accepted, implementation can follow this sequence:

```text
Architecture
      ↓
Domain Boundaries
      ↓
Domain Contracts
      ↓
Domain Models
      ↓
Application Services
      ↓
Persistence
      ↓
API
      ↓
Clients
```

Not:

```text
Database
      ↓
CRUD endpoints
      ↓
Frontend
      ↓
Try to discover architecture later
```

---

# 82. Relationship to Current Tawala

This document is intentionally implementation-neutral.

It does not assume that the current Tawala implementation is correct or incorrect.

The current implementation should be evaluated against these contracts.

Possible outcomes:

```text
CURRENT TAWALA
       |
       ↓
Architecture comparison
       |
       +---- Compatible
       |
       +---- Adaptable
       |
       +---- Boundary conflict
       |
       +---- Requires migration
```

The existing system should not be changed merely because this architecture is newer.

The architecture must first prove itself.

---

# 83. V1 vs V2 Decision Rule

A rewrite should only be considered when the current implementation has structural incompatibilities that are more expensive to correct incrementally than to migrate.

Possible reasons for V2:

```text
Tenant isolation cannot be safely established
Domain ownership is fundamentally entangled
Data models cannot support required invariants
Critical boundaries cannot be introduced safely
Security architecture cannot be repaired incrementally
Migration cost is lower than continued architectural debt
```

Otherwise:

```text
Refactor toward the architecture.
```

---

# 84. Migration Principle

If V2 becomes necessary:

> **Data migration is a separate engineering problem from application migration.**

The business data must be mapped:

```text
Old Model
    ↓
Migration Mapping
    ↓
New Domain Model
```

not blindly copied table-to-table.

---

# 85. Final Contract Principles

Tawala follows these principles:

```text
1. Commands express intent.

2. Queries retrieve information.

3. Events communicate facts.

4. Contracts belong to the domain that owns the capability.

5. Domains never depend on another domain's internals.

6. Tenant context travels with business operations.

7. Authorization happens before protected operations.

8. Domain rules remain inside their owning domain.

9. Events are immutable.

10. Important operations are idempotent.

11. External providers are isolated behind adapters.

12. Reporting consumes operational information; it does not own it.

13. Audit records history; it does not authorize actions.

14. Notifications should not become critical dependencies.

15. Contracts should be versionable.

16. Clients consume APIs, not internal models.

17. Hardware remains outside business domains.

18. Modular boundaries exist before service boundaries.

19. The database is an implementation detail of the domain.

20. A domain should be replaceable behind its contracts.
```

---

# 86. Final Architecture

Tawala now has the following conceptual stack:

```text
                    TAWALA
                       |
             +---------+---------+
             |                   |
          CLIENTS             PLATFORM
             |                   |
       +-----+-----+       +-----+------+
       |     |     |       |            |
   Desktop Web  Mobile  Identity     Security
       |                   |
       +---------+---------+
                 |
              API / Contracts
                 |
       +---------+---------+
       |         |         |
     Sales   Inventory    CRM
       |         |         |
       +----+----+----+----+
            |         |
       Purchasing   Payments
            |         |
            +----+----+
                 |
             Accounting
                 |
       +---------+---------+
       |                   |
   Reporting             Audit
       |
Notifications / Automation
```

Everything communicates through explicit boundaries.

---

# 87. Architecture Status

**PROPOSED — READY FOR IMPLEMENTATION MAPPING**

The architecture is now ready for comparison against the existing Tawala implementation.
