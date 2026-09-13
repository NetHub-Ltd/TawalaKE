
# TAWALA CODEBASE FORENSIC AUDIT

**Version:** 1.0.0
**Purpose:** Full architectural and implementation audit of the existing Tawala codebase

---

# 1. ROLE

You are acting as a **Codebase Forensic Engineer**.

Your job is to inspect the ENTIRE Tawala repository and produce a factual, evidence-based report describing the current implementation.

You are NOT the architect.

You are NOT being asked to redesign Tawala.

You are NOT being asked to fix anything.

You are NOT being asked to refactor anything.

You are performing reconnaissance.

The resulting report will be given to another senior engineer/architect who will compare the implementation against the target Tawala architecture and determine:

- what should remain
- what should be refactored
- what should be redesigned
- what can be migrated incrementally
- whether a V2 is justified

---

# 2. CRITICAL RULE

DO NOT MODIFY THE CODEBASE.

Do not:

- edit files
- rename files
- delete files
- create implementation files
- run migrations
- change configuration
- install packages
- upgrade dependencies
- format the codebase
- "fix" bugs you discover
- refactor anything

Read-only investigation only.

You may run commands necessary to inspect, analyze, build, type-check, test, or otherwise understand the existing system, provided those commands do not modify the repository.

If a command may modify the repository, DO NOT RUN IT.

---

# 3. ARCHITECTURAL CONTEXT

The following documents define the TARGET architectural direction for Tawala.

Read these documents before beginning the audit:

1. `TAWALA_CORE_ARCHITECTURE.md`
2. `TAWALA_DOMAIN_BOUNDARIES.md`
3. `TAWALA_DOMAIN_CONTRACTS.md`
4. `TAWALA_SECURITY_MODEL.md`

If any of these documents are unavailable, STOP and report which documents are missing before continuing.

These documents describe the intended architecture.

They are NOT evidence of what currently exists in the codebase.

Do not assume that the implementation follows them.

The purpose of this audit is precisely to discover the difference between:

```text
TARGET ARCHITECTURE
        ↓
CURRENT IMPLEMENTATION
````

---

# 4. AUDIT OBJECTIVES

The audit must answer five major questions.

## Question 1

What actually exists in the repository today?

## Question 2

How is the current system architecturally structured?

## Question 3

Where does the current implementation agree with the target architecture?

## Question 4

Where does it disagree?

## Question 5

Can the current implementation evolve toward the target architecture incrementally, or would a V2/migration be justified?

Do NOT answer Question 5 based on intuition.

Provide evidence that allows the architect to make that decision.

---

# 5. COMPLETE REPOSITORY SCAN

Inspect the entire repository.

Do not inspect only:

```text
backend/
frontend/
app/
src/
```

Look for everything relevant, including:

```text
application code
database models
schemas
API routes
services
repositories
middleware
authentication
authorization
configuration
environment handling
background jobs
workers
queues
events
integrations
tests
scripts
migrations
Docker
deployment manifests
CI/CD
documentation
generated code
shared libraries
utilities
configuration files
package manifests
Python configuration
TypeScript configuration
infrastructure
```

Also inspect:

```text
.gitignore
README files
package.json
pyproject.toml
poetry.lock
requirements files
Dockerfiles
docker-compose files
Kubernetes manifests
environment templates
Alembic configuration
tsconfig
Next.js configuration
Tailwind configuration
authentication configuration
```

Use the actual repository structure rather than assuming a conventional structure.

---

# 6. START WITH REPOSITORY INVENTORY

Before analyzing architecture, establish what exists.

Produce:

```text
Repository root
├── major directories
├── applications
├── backend services
├── frontend applications
├── shared packages
├── infrastructure
├── database
├── tests
├── scripts
└── documentation
```

For every major component, explain its apparent responsibility.

Do not merely dump a directory tree.

Create a useful architectural inventory.

---

# 7. TECHNOLOGY INVENTORY

Identify the technologies actually used.

Include:

### Frontend

* framework
* language
* UI system
* state management
* forms
* validation
* authentication
* API client
* data fetching
* build tooling

### Backend

* framework
* language
* ORM
* validation
* authentication
* authorization
* background processing
* API architecture

### Database

* database engine
* schemas
* major tables/models
* relationships
* enums
* indexes
* constraints
* migrations

### Infrastructure

* Docker
* Kubernetes
* reverse proxy
* cloud services
* queues
* caching
* object storage
* external integrations

### Testing

* unit tests
* integration tests
* API tests
* frontend tests
* end-to-end tests

---

# 8. APPLICATION BOUNDARIES

Determine the actual application boundaries.

Identify:

```text
Frontend applications
Backend applications
Workers
Background processes
Scheduled jobs
External services
Infrastructure services
```

For each one explain:

* responsibility
* entry point
* dependencies
* communication mechanism
* data access
* external dependencies

---

# 9. DOMAIN DISCOVERY

Do not assume that the code uses the domain boundaries defined in the architecture documents.

Discover the domains from the code.

Look at:

```text
models
services
routes
schemas
repositories
business logic
events
permissions
database tables
```

Identify the business capabilities currently represented.

For example:

```text
Sales
Inventory
CRM
Purchasing
Payments
Accounting
Users
Organizations
Branches
Reporting
Audit
Notifications
```

But do not force the implementation into these categories if the code says otherwise.

If the implementation has different boundaries, report those.

---

# 10. DOMAIN RESPONSIBILITY ANALYSIS

For every discovered domain/capability determine:

```text
What does it own?

What data does it own?

What business rules does it contain?

What API endpoints expose it?

What services implement it?

What database models represent it?

What other domains does it depend on?

What domains depend on it?
```

Also determine whether responsibilities are:

```text
clearly separated
partially separated
mixed
heavily coupled
```

---

# 11. DOMAIN BOUNDARY VIOLATIONS

Search specifically for boundary violations.

Examples include:

```text
Sales directly modifying Inventory models

CRM directly manipulating Sales tables

Accounting logic inside Sales services

Payment provider logic inside Sales

Frontend directly depending on database-shaped responses

One domain importing another domain's private implementation

Shared models containing unrelated business rules

Cross-domain database manipulation
```

For every significant violation provide:

```text
Location
File
Symbol/class/function
What it does
Why it crosses a boundary
Severity
```

Use exact file paths.

---

# 12. DATABASE ANALYSIS

Inspect the database layer thoroughly.

Identify:

```text
all major models
relationships
foreign keys
constraints
indexes
enums
nullable fields
defaults
soft deletes
timestamps
tenant fields
branch fields
ownership fields
```

Determine which models appear to belong to which business domains.

Look for:

```text
god models
overloaded models
duplicated entities
weak relationships
missing constraints
implicit relationships
domain leakage
```

---

# 13. MULTI-TENANCY FORENSIC ANALYSIS

This is one of the most important sections.

Determine exactly how tenancy currently works.

Answer:

```text
What represents a tenant?

Where is tenant identity stored?

How is tenant identity derived?

How does a request obtain tenant context?

Where is tenant filtering enforced?

Is tenant filtering automatic or manual?

Which models contain tenant identifiers?

Which models do not?

Can cross-tenant queries accidentally occur?

Can cross-tenant writes accidentally occur?

Are database constraints enforcing isolation?

Is tenant isolation enforced in middleware?

Is tenant isolation enforced in service logic?

Is tenant isolation enforced in repositories?

Is there defense in depth?

Can background jobs lose tenant context?

Can asynchronous workers lose tenant context?

Can admins legitimately cross tenant boundaries?

How is that controlled?
```

Do not merely say:

> "The application is multitenant."

Show how.

---

# 14. RBAC FORENSIC ANALYSIS

Inspect authorization.

Determine:

```text
roles
permissions
role assignment
permission assignment
tenant scope
branch scope
resource scope
middleware
dependency injection
decorators
guards
policy functions
frontend permission handling
backend enforcement
```

Answer:

```text
Where is authorization enforced?

Is authorization centralized?

Is it duplicated?

Can it be bypassed?

Are roles global or tenant-specific?

Can a user belong to multiple businesses?

Can a user have different roles in different businesses?

Can permissions be branch-specific?

Can users access multiple industries/businesses?

How is authorization represented in the database?
```

---

# 15. IDENTITY VS TENANT VS USER

Explicitly analyze the distinction between:

```text
User
Tenant
Business
Organization
Branch
Location
Role
Membership
```

if these concepts exist.

Determine whether the current system treats them correctly or conflates them.

This distinction is critical to the target Tawala architecture.

---

# 16. API ANALYSIS

Inspect all API routes.

For each major API area identify:

```text
endpoint
HTTP method
purpose
authentication
authorization
input schema
output schema
service called
database access
external integrations
```

Identify endpoints that:

```text
contain business logic
directly access ORM models
bypass service layers
perform cross-domain operations
mix multiple domain responsibilities
```

---

# 17. SERVICE LAYER ANALYSIS

Inspect service/application logic.

Determine whether services represent:

```text
domain logic
application orchestration
database operations
external integrations
validation
authorization
```

Identify services that do too much.

Specifically search for:

```text
god services
god functions
large transaction handlers
cross-domain orchestration
business rules embedded in routes
business rules embedded in repositories
```

---

# 18. REPOSITORY / DATA ACCESS ANALYSIS

Determine how data access works.

Answer:

```text
Are repositories used?

Are ORM models accessed directly?

Can any service query any model?

Are domain boundaries enforced by code structure?

Can one module freely access another module's tables?

Are transactions controlled consistently?

Where are database sessions created?
```

---

# 19. BUSINESS TRANSACTION ANALYSIS

Identify important workflows.

At minimum inspect:

```text
sale creation
checkout
payment
refund
inventory deduction
inventory adjustment
purchase
goods receiving
customer creation
user creation
branch creation
```

For each workflow describe:

```text
Entry point
Steps
Models touched
Services involved
External services
Transaction boundary
Events
Side effects
Failure handling
```

---

# 20. EVENT ANALYSIS

Determine whether the system currently uses:

```text
domain events
application events
webhooks
message queues
event buses
background jobs
database triggers
```

Identify:

```text
event producers
event consumers
event schemas
delivery mechanism
retry mechanism
idempotency
ordering assumptions
dead-letter handling
```

If there is no event architecture, explicitly state that.

Do not assume one exists simply because queues or webhooks exist.

---

# 21. IDEMPOTENCY ANALYSIS

Search for idempotency mechanisms.

Look for:

```text
idempotency keys
unique transaction references
request IDs
deduplication
event IDs
provider transaction IDs
database uniqueness constraints
```

Identify critical operations that are currently vulnerable to duplicate execution.

---

# 22. EXTERNAL INTEGRATIONS

Inventory every external integration.

Examples:

```text
M-PESA
SMS
email
payments
accounting
cloud storage
authentication providers
analytics
```

For each integration determine:

```text
where it lives
which domain owns it
whether provider-specific models leak into business logic
whether adapters exist
whether failures are handled
whether retries exist
whether idempotency exists
```

---

# 23. FRONTEND ARCHITECTURE

Inspect the frontend deeply.

Determine:

```text
routing
layouts
feature boundaries
components
state management
API calls
authentication
authorization
forms
validation
error handling
caching
server/client boundaries
```

Identify whether the frontend is:

```text
feature-oriented
domain-oriented
page-oriented
CRUD-oriented
mixed
```

Determine whether UI components depend directly on backend implementation details.

---

# 24. DESKTOP / MOBILE / WEB READINESS

The target architecture requires:

```text
Desktop
Web
Mobile
```

to share the same Tawala core.

The current repository may or may not support this.

Assess:

```text
Can the existing backend serve multiple clients cleanly?

Are APIs client-agnostic?

Is business logic trapped inside the web frontend?

Are there assumptions that only a browser exists?

Are authentication flows reusable?

Are offline workflows possible?

Are hardware integrations isolated?

Can a desktop client consume the same contracts?
```

Do not recommend implementation yet.

Only report readiness.

---

# 25. SECURITY ANALYSIS

Inspect:

```text
authentication
authorization
session handling
JWT
cookies
CSRF
CORS
password handling
secrets
environment variables
API keys
webhooks
rate limiting
input validation
SQL injection protection
tenant isolation
audit logging
```

Identify concrete security weaknesses.

For each:

```text
File
Location
Problem
Potential impact
Evidence
```

Do not exploit anything.

This is a code review, not a penetration test.

---

# 26. AUDIT TRAIL

Determine whether the system records:

```text
who
did what
when
to which resource
under which tenant
from which request
```

Identify:

```text
audit models
audit services
event logging
database history
application logs
```

Distinguish operational logs from actual business audit trails.

---

# 27. OBSERVABILITY

Inspect:

```text
logging
structured logging
request IDs
trace IDs
metrics
health checks
error tracking
monitoring
```

Determine whether a business operation can be traced across:

```text
API
service
database
queue
worker
external provider
```

---

# 28. DATA INTEGRITY

Inspect database constraints and application validation.

Look for:

```text
nullable fields where they should not be nullable
missing uniqueness
missing foreign keys
duplicate business identities
invalid state transitions
inconsistent enum usage
race conditions
partial transactions
```

Do not fix them.

Document them.

---

# 29. STATE MACHINES

Identify entities that have meaningful lifecycle states.

Examples:

```text
Sale
Invoice
Payment
Purchase Order
Stock Transfer
User
Business
```

For each identify:

```text
states
allowed transitions
where transitions are implemented
whether transitions are enforced
whether invalid transitions are possible
```

---

# 30. CURRENT ARCHITECTURE DIAGRAM

Produce a text-based diagram of the CURRENT system.

For example:

```text
Frontend
   |
API
   |
Services
   |
ORM
   |
PostgreSQL
```

But make yours accurate to the actual repository.

Include:

```text
workers
queues
external providers
cache
storage
```

where applicable.

---

# 31. CURRENT DOMAIN MAP

Produce a diagram showing:

```text
Domain A
   |
   +---- Domain B
   |
   +---- Domain C
```

Use this to visualize coupling.

If everything depends on everything else, show that honestly.

---

# 32. TARGET VS CURRENT COMPARISON

Now compare the implementation against:

```text
TAWALA_CORE_ARCHITECTURE.md
TAWALA_DOMAIN_BOUNDARIES.md
TAWALA_DOMAIN_CONTRACTS.md
TAWALA_SECURITY_MODEL.md
```

For each major architectural principle classify it as:

```text
MATCH
PARTIAL MATCH
MISMATCH
UNKNOWN
NOT IMPLEMENTED
```

Do not use vague language.

Every classification must have evidence.

---

# 33. COMPATIBILITY MATRIX

Produce a table:

| Architectural Requirement | Current Implementation | Status                 | Evidence |
| ------------------------- | ---------------------- | ---------------------- | -------- |
| Multi-tenancy             | ...                    | MATCH/PARTIAL/MISMATCH | file     |
| Tenant isolation          | ...                    | ...                    | ...      |
| RBAC                      | ...                    | ...                    | ...      |
| Domain boundaries         | ...                    | ...                    | ...      |
| Contracts                 | ...                    | ...                    | ...      |
| Event architecture        | ...                    | ...                    | ...      |
| Audit trail               | ...                    | ...                    | ...      |
| Multi-client API          | ...                    | ...                    | ...      |
| Inventory ownership       | ...                    | ...                    | ...      |
| Payment boundary          | ...                    | ...                    | ...      |
| Accounting boundary       | ...                    | ...                    | ...      |
| Reporting                 | ...                    | ...                    | ...      |

Expand this table significantly based on what you discover.

---

# 34. ARCHITECTURAL DEBT

Identify architectural debt.

Classify each item:

### Critical

Prevents the target architecture from being safely implemented.

### High

Creates serious coupling or security/data-integrity problems.

### Medium

Makes future evolution harder.

### Low

Mostly structural or maintainability concerns.

For every item include:

```text
Problem
Evidence
Affected domains
Why it matters
Potential architectural consequence
```

Do NOT propose a solution yet unless necessary to explain the problem.

---

# 35. REFACTORABILITY

For each major mismatch determine whether it appears:

```text
Easily Refactorable
Moderately Refactorable
Difficult but Possible
Structurally Incompatible
Unknown
```

Explain why.

The goal is to distinguish:

```text
"We need to reorganize some code"
```

from:

```text
"The current architecture prevents the required model."
```

---

# 36. V1 VS V2 EVIDENCE

Do NOT simply recommend V2.

Instead, provide evidence under two categories.

## Reasons V1 Can Evolve

Examples:

```text
Existing models already represent required concepts.
Tenant isolation can be introduced incrementally.
Domain logic can be extracted.
API contracts can be introduced without replacing storage.
```

## Reasons V2 May Be Justified

Examples:

```text
Core entities are fundamentally incompatible.
Tenant boundaries cannot be safely repaired.
Data ownership is irreversibly coupled.
Security model cannot be safely migrated incrementally.
```

Only list evidence discovered in the codebase.

---

# 37. MIGRATION OBSERVATIONS

Do NOT design a migration plan.

Instead identify what migration would likely involve.

For example:

```text
Existing Customer table
    ↓
Potential CRM Customer model
```

or:

```text
Current User/Business relationship
    ↓
Potential Membership model
```

Identify:

```text
entities likely requiring transformation
data likely requiring splitting
data likely requiring merging
data requiring historical snapshots
data requiring new identifiers
```

This information will be used later to design the actual migration strategy.

---

# 38. CRITICAL UNKNOWNs

Maintain a dedicated section:

# UNKNOWN / UNVERIFIABLE

List anything that could not be established from the repository.

Examples:

```text
Production database constraints unknown
External service behavior unknown
Runtime environment unknown
Actual tenant usage patterns unknown
```

Never fill unknowns with assumptions.

---

# 39. EVIDENCE STANDARD

Every important conclusion must be traceable to repository evidence.

Use this format:

```text
Finding:
Sales directly modifies inventory state.

Evidence:
backend/app/services/checkout.py
function: finalize_checkout()
lines: approximately X-Y

Observed behavior:
The checkout service updates inventory quantities directly.

Architectural implication:
Sales currently owns part of Inventory behavior.
```

Use exact file paths and symbols whenever possible.

Line numbers are strongly preferred.

---

# 40. DO NOT OVERSTATE

Avoid statements like:

> "This architecture is bad."

Instead say:

> "This implementation couples Sales to Inventory persistence because `checkout.py` directly updates the Inventory model."

Facts first.

Judgment second.

---

# 41. DO NOT INVENT INTENT

If the code does something unusual, do not assume why.

Do not write:

> "The developer probably did this because..."

Instead write:

> "The implementation currently does X."

---

# 42. DUPLICATION ANALYSIS

Identify duplicated concepts.

Examples:

```text
User
Customer
Organization
Business
Branch
Product
Item
Payment
Transaction
Invoice
Order
```

Determine whether the repository contains multiple representations of the same concept.

For each duplication explain:

```text
where
how they differ
whether duplication appears intentional
whether ownership is clear
```

---

# 43. "GOD OBJECT" ANALYSIS

Identify oversized:

```text
models
services
controllers
routes
components
modules
```

that appear to own too many responsibilities.

Do not judge size alone.

Focus on responsibility concentration.

---

# 44. DEPENDENCY GRAPH

Produce a conceptual dependency graph showing:

```text
Frontend
API
Services
Domains
Repositories
Models
Infrastructure
External Providers
```

Highlight major cycles.

Especially identify:

```text
Domain A → Domain B → Domain A
```

because these are important architectural warning signs.

---

# 45. CIRCULAR DEPENDENCIES

Explicitly search for circular dependencies at:

```text
module level
service level
domain level
database relationship level
```

Document meaningful cycles.

---

# 46. TEST COVERAGE AS ARCHITECTURAL EVIDENCE

Inspect tests.

Do not merely report percentages.

Determine whether tests demonstrate:

```text
tenant isolation
authorization
business invariants
inventory correctness
payment correctness
domain boundaries
API contracts
idempotency
```

Identify important business behavior that has no tests.

---

# 47. CONFIGURATION ANALYSIS

Inspect configuration architecture.

Determine:

```text
environment variables
secrets
feature flags
tenant configuration
business configuration
branch configuration
provider configuration
```

Identify whether configuration is:

```text
global
tenant-specific
business-specific
branch-specific
```

---

# 48. PERFORMANCE ARCHITECTURE

Look for obvious architectural performance concerns.

Examples:

```text
N+1 queries
large joins
unbounded queries
missing indexes
synchronous external API calls
heavy dashboard queries
large transactions
repeated database lookups
```

Only report observable evidence.

Do not benchmark unless safe and practical.

---

# 49. CONCURRENCY / CONSISTENCY

Inspect operations involving:

```text
stock
payments
balances
inventory transfers
sequence numbers
counters
```

Look for:

```text
race conditions
non-atomic updates
missing locking
duplicate processing
inconsistent state
```

Again, report evidence rather than speculation.

---

# 50. BUSINESS CAPABILITY INVENTORY

At the end of discovery, produce a capability map.

Example:

```text
Sales
  ✓ Quotes
  ✓ Orders
  ✓ Invoices
  ? Returns
  ✗ Unknown

Inventory
  ✓ Stock
  ✓ Adjustments
  ? Transfers
```

Use:

```text
✓ Implemented
△ Partial
? Unclear
✗ Not found
```

Do not assume a feature exists because a model exists.

Look for actual implementation.

---

# 51. FINAL REPORT STRUCTURE

Your final report MUST follow this structure.

---

# TAWALA CODEBASE FORENSIC AUDIT

## 1. Executive Summary

Short summary of the current system.

---

## 2. Repository Overview

What exists.

---

## 3. Technology Stack

Actual technologies.

---

## 4. Application Architecture

Current architecture.

---

## 5. Current Domain Model

Discovered business domains.

---

## 6. Domain Ownership

What each domain currently owns.

---

## 7. Domain Dependencies

How domains communicate today.

---

## 8. Domain Boundary Violations

Concrete violations with evidence.

---

## 9. Database Architecture

Models, relationships, constraints.

---

## 10. Multi-Tenancy Analysis

Detailed tenancy implementation.

---

## 11. RBAC / Authorization Analysis

Detailed access-control implementation.

---

## 12. Identity / Business / Branch Model

How these concepts currently relate.

---

## 13. API Architecture

Routes, contracts, and coupling.

---

## 14. Service Architecture

Application/domain/service structure.

---

## 15. Event Architecture

Events, queues, workers, webhooks.

---

## 16. Idempotency

Current mechanisms and gaps.

---

## 17. External Integrations

Providers and adapters.

---

## 18. Frontend Architecture

Current web client structure.

---

## 19. Multi-Client Readiness

Desktop/Web/Mobile readiness.

---

## 20. Security Analysis

Concrete security findings.

---

## 21. Audit Trail

Current audit capabilities.

---

## 22. Observability

Logging, tracing, metrics.

---

## 23. Data Integrity

Constraints and invariants.

---

## 24. Important Business Workflows

Detailed workflow analysis.

---

## 25. Current Architecture Diagram

Text diagram.

---

## 26. Current Domain Dependency Diagram

Text diagram.

---

## 27. Target Architecture Comparison

Compare against the four architecture documents.

---

## 28. Compatibility Matrix

Detailed table.

---

## 29. Architectural Debt

Prioritized findings.

---

## 30. Refactorability Assessment

What appears easy/hard to change.

---

## 31. V1 vs V2 Evidence

Evidence only.

---

## 32. Migration-Relevant Observations

Data transformation observations.

---

## 33. Missing / Unknown Information

Anything unverifiable.

---

## 34. Capability Inventory

Current business capabilities.

---

## 35. Critical Findings

The most important findings.

---

## 36. Final Forensic Assessment

A concise factual conclusion describing:

```text
Current architectural shape
Major strengths
Major structural problems
Major security/data-isolation concerns
Degree of compatibility with target architecture
Likely scale of required change
```

Do NOT make the final V1/V2 decision unless the evidence is overwhelming.

The architect receiving this report will make that decision.

---

# 52. REPORT QUALITY REQUIREMENTS

The report must be:

```text
Detailed
Evidence-based
Objective
Technically precise
Readable
Structured
Traceable
```

Avoid:

```text
marketing language
unnecessary praise
unnecessary criticism
speculation
generic best-practice lectures
```

The goal is to understand the codebase.

---

# 53. IMPORTANT: READ EVERYTHING RELEVANT

Do not stop after finding the first implementation of something.

For important concepts such as:

```text
tenant
user
business
sale
inventory
payment
customer
role
permission
```

trace them through:

```text
database
schema
service
API
frontend
tests
```

We need to understand the lifecycle of important business concepts.

---

# 54. IMPORTANT: FOLLOW REAL EXECUTION PATHS

When possible, trace actual flows.

For example:

```text
POST /sales
    ↓
route
    ↓
schema
    ↓
service
    ↓
repository
    ↓
database
    ↓
events
    ↓
external effects
```

Do not infer architecture from filenames alone.

---

# 55. IMPORTANT: DISTINGUISH STRUCTURE FROM INTENTION

A folder named:

```text
domains/inventory
```

does not prove Inventory is actually isolated.

Inspect imports and behavior.

Likewise:

```text
services/payment.py
```

does not prove Payments is a domain.

The code's actual dependencies are the evidence.

---

# 56. IMPORTANT: FOLLOW THE DATA

For major entities trace:

```text
Creation
Storage
Modification
Relationships
API exposure
Frontend usage
Deletion/archival
Events
Audit
```

This is especially important for:

```text
User
Business/Tenant
Branch
Customer
Product
Sale
Payment
Inventory
Supplier
```

---

# 57. IMPORTANT: SECURITY FIRST

If you discover a potential tenant-isolation or authorization vulnerability:

Document it clearly.

Example:

```text
SEVERITY: CRITICAL

Finding:
Resource lookup accepts an arbitrary ID without verifying tenant ownership.

Evidence:
path/to/file.py
function_name()

Impact:
A caller may potentially access another tenant's resource if they know its identifier.

Confidence:
Confirmed / Likely / Possible
```

Do not exploit the vulnerability.

Do not attempt to access other tenants' data.

Static code analysis is sufficient.

---

# 58. CONFIDENCE LEVELS

For significant findings use:

```text
CONFIRMED
LIKELY
POSSIBLE
UNKNOWN
```

Use CONFIRMED when the code clearly demonstrates the behavior.

Use LIKELY when the structure strongly indicates it.

Use POSSIBLE when there is evidence but insufficient proof.

Use UNKNOWN when the repository cannot establish it.

---

# 59. FINAL PRINCIPLE

The purpose of this audit is not to prove that the current Tawala implementation is good or bad.

The purpose is to answer:

> **What is Tawala today?**

with enough precision that another engineer can safely answer:

> **What should Tawala become, and how do we get there?**

Do not optimize for defending the existing code.

Do not optimize for justifying a rewrite.

Optimize for truth.

---

# END OF AUDIT INSTRUCTIONS

````
