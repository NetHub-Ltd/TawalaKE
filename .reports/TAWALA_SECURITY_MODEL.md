# TAWALA SECURITY MODEL

**Version:** 1.0.0  
**Status:** Objective Architecture Proposal  
**Depends On:** `TAWALA_CORE_ARCHITECTURE.md`  
**Related:** `TAWALA_DOMAIN_MODEL.md`

---

# 1. Purpose

This document defines how security works inside Tawala.

The primary goals are:

- Strong tenant isolation
- Role-Based Access Control (RBAC)
- Scoped access
- Secure business context
- Server-side authorization
- Protection of sensitive business operations
- Auditable actions
- Secure client access
- Safe integrations
- Defense in depth

The most important principle is:

> **A user must never gain access to business data simply because they know its identifier.**

Security is part of the Tawala architecture.

It is not something added after the application is built.

---

# 2. The Security Model in One Picture

At a high level:

```text
User
 |
Authentication
 |
Identity
 |
Business Membership
 |
Role
 |
Permission
 |
Scope
 |
Resource Authorization
 |
Business Operation
 |
Audit
````

A successful login does not mean the user can do everything.

Authentication answers:

> "Who are you?"

Authorization answers:

> "What are you allowed to do?"

Tenant isolation answers:

> "Which business data are you allowed to access?"

Scope answers:

> "Which part of that business are you allowed to access?"

---

# 3. Security Principles

Tawala follows these principles:

## 3.1 Deny by default

If access has not been explicitly granted, it is denied.

---

## 3.2 Server decides

The client can request an operation.

The client cannot grant itself permission.

---

## 3.3 Tenant comes first

Before accessing business data, Tawala must establish which business context the request belongs to.

---

## 3.4 Permissions are explicit

Access should come from defined permissions and roles.

---

## 3.5 Scope matters

A user may have permission to perform an action without having permission to perform it everywhere.

---

## 3.6 Sensitive operations are traceable

Important actions must produce audit records.

---

## 3.7 Security exists in multiple layers

No single security check should be the only thing protecting tenant data.

---

# 4. Identity

A User represents a Tawala identity.

The identity system answers:

```text
Who is this person?
```

It may contain information such as:

```text
User ID
Name
Email
Phone
Authentication credentials
Account status
```

Authentication details should remain separate from business authorization.

A user's identity does not automatically give access to any business.

---

# 5. Authentication

Authentication establishes that a person controls an account.

Possible authentication methods may include:

```text
Password
Passkey
Email verification
Phone verification
Multi-factor authentication
Social identity providers
```

The exact authentication mechanisms are implementation decisions.

The security model only requires that authentication establish a trusted identity.

---

# 6. Authentication Is Not Authorization

A successfully authenticated user may still have no access to a particular business.

Example:

```text
User: Jane

Authenticated: YES

Business A membership: YES
Business B membership: NO
```

Jane may access Business A.

Jane must not access Business B.

Knowing the Business B identifier does not change this.

---

# 7. Business Membership

A User accesses a Business through Membership.

Conceptually:

```text
User
 |
Membership
 |
Business
```

The Membership determines the user's relationship with that business.

It may define:

```text
Status
Roles
Permissions
Scope
```

A user may have many memberships.

---

# 8. Membership Lifecycle

A membership should have an explicit lifecycle.

For example:

```text
Invited
   |
Pending
   |
Active
   |
Suspended
   |
Revoked
```

A revoked membership cannot be used to access the business.

A suspended membership should not be able to perform normal business operations.

Historical membership information should remain auditable.

---

# 9. Business Context

Every authenticated request that accesses business data must have an authorized business context.

Conceptually:

```text
Request
 |
Authenticated User
 |
Selected Business
 |
Membership Verification
 |
Authorization
 |
Operation
```

The selected business is not trusted merely because the client supplied its ID.

The server must verify:

> "Does this user have an active membership in this business?"

---

# 10. Never Trust Client Tenant IDs

A client may send:

```text
business_id = "abc"
```

That does not mean the request is authorized for Business ABC.

The server must resolve and verify the business context.

The rule is:

> **Client input identifies what the client wants. Authorization determines what the client may actually access.**

---

# 11. Tenant Isolation

Tenant isolation is one of the strongest requirements in Tawala.

Business A must not be able to access Business B's data.

This includes indirect access.

For example, Business A must not be able to discover Business B's:

```text
Customers
Products
Invoices
Sales
Payments
Inventory
Employees
Reports
Audit records
Files
Configuration
```

through:

* Guessing IDs
* Changing URLs
* Modifying request bodies
* Changing query parameters
* Manipulating client state
* Calling APIs directly
* Using another application client

---

# 12. Tenant Isolation Is Not a UI Feature

Hiding another business from a dropdown is not security.

This is insufficient:

```text
if user_is_not_allowed:
    hide_business()
```

The API and data layer must enforce the boundary.

Even if someone bypasses the interface and directly calls the API, the operation must fail.

---

# 13. Tenant Boundary

The Business is the default security boundary for business data.

Conceptually:

```text
Business A
|
+-- Users
+-- Customers
+-- Products
+-- Sales
+-- Inventory
+-- Payments
+-- Reports
+-- Audit

Business B
|
+-- Users
+-- Customers
+-- Products
+-- Sales
+-- Inventory
+-- Payments
+-- Reports
+-- Audit
```

These environments are logically isolated.

---

# 14. User With Multiple Businesses

A user may have:

```text
User
|
+-- Business A
|     Role: Owner
|
+-- Business B
|     Role: Manager
|
+-- Business C
      Role: Accountant
```

The user's permissions must be evaluated separately for each business.

Being an Owner in Business A does not make the user an Owner in Business B.

---

# 15. RBAC

Tawala uses Role-Based Access Control.

The basic structure is:

```text
User
 |
Membership
 |
Role
 |
Permissions
```

Example:

```text
Cashier
 |
 +-- sales.create
 +-- sales.view
 +-- payments.create
```

---

# 16. Roles

Roles represent collections of permissions.

Common examples:

```text
Owner
Administrator
Manager
Cashier
Accountant
Stock Manager
Salesperson
```

These are examples, not mandatory system roles.

Businesses should be able to configure roles appropriate to their operations.

---

# 17. Permissions

Permissions represent actions.

Examples:

```text
sales.create
sales.view
sales.edit
sales.cancel

inventory.view
inventory.adjust
inventory.transfer

customers.create
customers.view
customers.edit

payments.create
payments.view
payments.refund

reports.sales.view
reports.financial.view

users.invite
users.manage

business.settings.manage
```

Permissions should describe capabilities rather than screens.

---

# 18. Permission Naming

Permissions should follow a consistent structure.

Conceptually:

```text
<domain>.<action>
```

Examples:

```text
sales.create
sales.view
sales.cancel

inventory.view
inventory.transfer

customers.create
customers.edit
```

More complex permissions may use additional structure where necessary.

The naming system should remain predictable.

---

# 19. Roles Are Not Security Boundaries

A role is a convenient way of grouping permissions.

It should not be treated as the entire authorization system.

For example:

```text
Manager
```

does not automatically mean:

```text
Can access everything.
```

A manager may have:

```text
sales.view
inventory.view
inventory.adjust
staff.manage
```

but not:

```text
financial_reports.view
```

unless explicitly granted.

---

# 20. Scope

Scope determines where a permission applies.

Example:

```text
Jane
Role: Branch Manager
Permission: inventory.view
Scope: Embu Branch
```

Jane can view:

```text
Embu inventory
```

but not necessarily:

```text
Nairobi inventory
```

---

# 21. Scope Hierarchy

A possible organizational scope is:

```text
Business
 |
+-- Branch
     |
     +-- Location
          |
          +-- Resource
```

Authorization may therefore be restricted at different levels.

For example:

```text
Business-wide
Branch-wide
Location-specific
```

The exact scope model will be refined during implementation design.

---

# 22. Scope Must Never Escape the Tenant

A scope is always evaluated inside its business context.

For example:

```text
Business A
|
+-- Embu Branch
```

and:

```text
Business B
|
+-- Embu Branch
```

are completely different resources.

The fact that both branches are called "Embu" means nothing.

Their identity belongs to their respective businesses.

---

# 23. Resource Authorization

Before performing an operation, Tawala should determine:

```text
Who?
Which Business?
What Permission?
Which Resource?
Which Scope?
What Operation?
```

Example:

```text
Jane wants to cancel Invoice INV-100.
```

Tawala must determine:

```text
Is Jane authenticated?
Does Jane belong to this Business?
Does Jane have invoice cancellation permission?
Does that permission apply to this branch?
Does INV-100 belong to this Business?
Is INV-100 in Jane's authorized scope?
Is the invoice in a state where cancellation is allowed?
```

Only then should the operation proceed.

---

# 24. Authorization Is More Than RBAC

The full authorization decision is:

```text
Identity
+
Membership
+
Role
+
Permission
+
Scope
+
Resource ownership
+
Business rules
```

This prevents RBAC from becoming an excuse to ignore business rules.

---

# 25. Example: Refund

Suppose a cashier has:

```text
sales.refund
```

That does not necessarily mean they can refund anything.

The business may require:

```text
Refund permission
+
Correct branch
+
Sale belongs to business
+
Sale is refundable
+
Refund amount within allowed limit
```

A manager may be required for larger refunds.

That is a business rule layered on top of RBAC.

---

# 26. Example: Stock Adjustment

A Stock Manager may have:

```text
inventory.adjust
```

But the system may still require:

```text
Correct business
+
Authorized branch
+
Authorized location
+
Valid adjustment reason
+
Audit record
```

Permissions allow the operation.

Business rules determine whether the specific operation is valid.

---

# 27. Privileged Roles

Some roles have very high privileges.

Examples:

```text
Owner
Platform Administrator
Security Administrator
```

High privilege does not mean security rules should disappear.

Even privileged operations should be:

* Authenticated
* Authorized
* Audited
* Traceable

---

# 28. Owner

The Business Owner generally has broad business authority.

However, Owner access should still be represented through explicit permissions.

This gives Tawala a consistent authorization model.

Instead of:

```text
if user.is_owner:
    bypass_security()
```

the system should conceptually operate as:

```text
Owner
 |
Broad permissions
 |
Normal authorization system
```

This keeps the architecture predictable.

---

# 29. Platform Administrators

Tawala's internal platform administrators are different from business users.

They operate the Tawala platform itself.

They should not automatically have unrestricted access to customer business data.

Platform-level administration and tenant-level administration should be separate security domains.

If support staff need temporary access to a customer's business, that access should be:

* Explicit
* Limited
* Authorized
* Time-bound where possible
* Audited

---

# 30. Support Access

A future support system may allow controlled assistance.

Example:

```text
Support Agent
 |
Temporary Access Request
 |
Business Owner Approval
 |
Limited Scope
 |
Time Limit
 |
Audit
```

This prevents "support access" from becoming an invisible master key.

---

# 31. Sensitive Operations

Certain actions require stronger controls.

Examples:

```text
Refunds
Financial adjustments
Stock adjustments
User permission changes
Business deletion
Business ownership changes
Large transactions
Account changes
Integration credential changes
```

These operations should have stronger auditing and potentially additional approval requirements.

---

# 32. Audit Trail

Security-sensitive actions must generate audit records.

An audit record should capture enough information to answer:

> Who did what, where, when, and to what?

Example:

```text
User:
Jane

Business:
ABC Hardware

Action:
Inventory Adjustment

Resource:
Cement 50kg

Branch:
Embu

Previous quantity:
120

New quantity:
110

Reason:
Damaged stock

Time:
2026-08-26 14:32
```

---

# 33. Audit Records Are Protected

Ordinary users should not be able to:

```text
Delete audit records
Modify audit records
Rewrite history
```

Audit records should be treated as protected historical information.

Access to audit records should itself be permission-controlled.

---

# 34. Security Events

Security events should be recorded separately from ordinary business events where appropriate.

Examples:

```text
LoginSucceeded
LoginFailed
PasswordChanged
MFAEnabled
MembershipCreated
MembershipRevoked
RoleChanged
PermissionChanged
BusinessAccessDenied
SensitiveOperationPerformed
```

These events help investigate suspicious activity.

---

# 35. Sessions

A session represents an authenticated interaction with Tawala.

Sessions should have:

```text
Identity
Expiration
Status
Security context
```

The implementation may use cookies, tokens, or another mechanism.

The Core security model does not depend on a specific authentication technology.

---

# 36. Client Security

Tawala has:

```text
Desktop
Web
Mobile
```

None of these clients should be trusted to enforce authorization.

The clients can improve user experience by hiding unavailable actions.

But the server must enforce the actual permission.

Example:

```text
Web hides "Refund"
```

This is good UX.

But the API must still reject:

```text
POST /refund
```

when the user lacks permission.

---

# 37. Desktop Security

Desktop applications may have access to:

* Local hardware
* Local storage
* Offline data
* Cached business information

Therefore the Desktop client must be treated as an untrusted environment.

Sensitive authorization decisions remain server-controlled.

If offline operation is eventually supported, offline authorization becomes a specialized security problem that must be designed separately.

---

# 38. Mobile Security

Mobile devices may be lost or compromised.

The mobile application should minimize sensitive locally stored information.

Remote access should be revocable.

A business administrator should eventually be able to revoke a user's sessions or device access.

---

# 39. Web Security

Web sessions should be protected against common attacks.

The eventual implementation must consider:

```text
CSRF
XSS
Session theft
Credential stuffing
Brute-force login attempts
Session fixation
Insecure direct object references
```

The architecture specifically calls out **insecure direct object references** because tenant isolation depends heavily on preventing unauthorized resource access through guessed identifiers.

---

# 40. API Security

Every protected API operation should establish:

```text
Authenticated identity
+
Authorized business context
+
Permission
+
Scope
+
Resource ownership
```

The API must not assume that because a request came from an authenticated client, it is trustworthy.

---

# 41. Direct Object Access

This is a critical rule.

Suppose an invoice has:

```text
id = INV-100
```

A user must not gain access simply by changing:

```text
/invoices/INV-100
```

to:

```text
/invoices/INV-101
```

The server must verify that the requested invoice belongs to an authorized business and scope.

This principle applies to every resource.

---

# 42. Data Access Layer

The data access layer should make tenant-aware access the normal path.

Conceptually:

```text
Authorized Business
       |
       ↓
Scoped Query
       |
       ↓
Resource
```

Developers should not have to remember to manually add tenant filtering to every query as an informal convention.

The architecture should make unsafe access difficult.

---

# 43. Defense in Depth

Tenant isolation should not depend on one line of code.

A strong design uses multiple protections:

```text
Authentication
      ↓
Membership verification
      ↓
Permission verification
      ↓
Scope verification
      ↓
Resource ownership
      ↓
Tenant-aware data access
      ↓
Database constraints
      ↓
Audit
```

Not every layer has to implement the same check.

Each layer should provide another barrier.

---

# 44. Database Isolation

The final implementation should consider database-level protections where appropriate.

Possible approaches include:

```text
Tenant-aware application queries
Database constraints
PostgreSQL Row-Level Security
Separate schemas
Separate databases
```

The architecture does not mandate one strategy yet.

The chosen strategy must provide strong isolation without making the platform unnecessarily difficult to operate.

---

# 45. Encryption

Sensitive information should be protected appropriately.

Data should be protected:

```text
In transit
At rest
```

Sensitive secrets such as integration credentials should receive additional protection.

Passwords must never be stored as plain text.

---

# 46. Secrets

Secrets may include:

```text
API keys
Payment credentials
M-PESA credentials
SMS credentials
Database credentials
OAuth secrets
Signing keys
```

These should not be stored casually in application databases or source code.

Secrets should have controlled access and rotation mechanisms.

---

# 47. Integration Security

External integrations must operate within controlled boundaries.

For example:

```text
Tawala
 |
Payment Integration
 |
M-PESA
```

An integration should only have access to what it needs.

Integration credentials belong to the appropriate business context.

Business A's payment credentials must never be available to Business B.

---

# 48. Webhooks

Incoming webhooks should be treated as untrusted external input.

Tawala must verify:

```text
Source authenticity
Payload validity
Business association
Idempotency
Replay protection
```

A webhook must never be allowed to directly bypass normal business authorization and domain rules.

---

# 49. Service-to-Service Access

As Tawala grows, internal services or modules may need to communicate.

Internal communication should still have controlled identities and permissions.

The architecture should not assume:

```text
internal = trusted
```

An internal component should only have the access it actually needs.

---

# 50. Least Privilege

Every actor should receive the minimum access required to perform their job.

Example:

A cashier does not need:

```text
Business ownership
User administration
Financial configuration
Integration secrets
```

A stock manager does not necessarily need:

```text
Payroll
User permissions
Financial statements
```

Least privilege reduces the impact of mistakes and compromised accounts.

---

# 51. Separation of Duties

Important business actions may require different people.

For example:

```text
Employee creates refund
        ↓
Manager approves refund
```

or:

```text
Employee requests stock adjustment
        ↓
Manager approves adjustment
```

This should be supported as a capability where the business requires it.

---

# 52. Approval Workflows

Some actions may require approval.

Conceptually:

```text
Requested
   ↓
Pending Approval
   ↓
Approved
   ↓
Executed
```

or:

```text
Requested
   ↓
Rejected
```

Approval workflows should be generic enough to support different business domains.

---

# 53. Security and Business Rules

Security and business rules are related but different.

Example:

```text
RBAC:
Jane may refund sales.

Business rule:
Only sales within Jane's branch may be refunded.

Transaction rule:
The sale must actually be refundable.
```

All three must succeed.

---

# 54. Data Visibility

Not every authorized user should necessarily see every field.

Example:

A cashier may be allowed to view a customer but not:

```text
Customer internal notes
Sensitive financial information
Private administrative information
```

The architecture should allow field-level or data-class restrictions where genuinely necessary.

This should not be introduced everywhere by default.

---

# 55. Files and Attachments

Files should inherit the security context of the business resource they belong to.

For example:

```text
Invoice
 |
Attachment
```

The attachment must not become publicly accessible merely because someone knows its storage URL.

File access should be authorized through Tawala's security model.

---

# 56. Logging

Application logs and audit records are different.

## Logs

Used for:

```text
Debugging
Errors
Performance
Operations
```

## Audit

Used for:

```text
Accountability
Security
Business history
Compliance
```

A log should not be treated as a replacement for an audit trail.

---

# 57. Error Handling

Security failures should not reveal unnecessary information.

For example, the system should avoid exposing whether another tenant's resource exists.

Instead of:

```text
Invoice INV-100 exists, but you cannot access it.
```

the API may return an appropriate generic authorization/resource response.

This prevents information leakage.

---

# 58. Rate Limiting

Public and sensitive endpoints should be protected against abuse.

Potential targets include:

```text
Login
Password reset
Verification
Public APIs
Webhook endpoints
High-cost operations
```

Rate limits should be appropriate to the operation.

---

# 59. Account Recovery

Account recovery must be designed as a security-sensitive operation.

A recovery process should establish that the requester is legitimately authorized to regain access.

Recovery should not become an easier path into an account than normal authentication.

---

# 60. Business Ownership Changes

Changing the owner of a business is highly sensitive.

The operation should require:

```text
Strong authorization
Verification
Audit
```

Potentially:

```text
Current owner approval
New owner confirmation
Additional authentication
```

The exact workflow is an implementation decision.

---

# 61. Business Deletion

Business deletion is a destructive operation.

It should not be a casual API call.

A future implementation should consider:

```text
Explicit confirmation
Strong authentication
Owner permission
Audit
Retention requirements
Backup
Recovery period
```

Hard deletion should not automatically happen immediately.

---

# 62. Security Boundaries

Tawala has several important security boundaries:

```text
Platform
   |
Business
   |
Branch
   |
Location
   |
Resource
```

And:

```text
User
   |
Membership
   |
Role
   |
Permission
   |
Scope
```

Both dimensions matter.

---

# 63. The Complete Authorization Question

Before Tawala allows a protected operation, it should effectively answer:

```text
WHO is acting?

WHICH BUSINESS are they acting in?

DO THEY BELONG to that business?

WHAT ROLE do they have?

WHAT PERMISSION is required?

DOES THEIR SCOPE include this resource?

DOES THE RESOURCE BELONG to that business?

IS THE OPERATION VALID according to business rules?

DOES THIS ACTION REQUIRE APPROVAL?

SHOULD THE ACTION BE AUDITED?
```

If any required condition fails:

```text
DENY
```

---

# 64. Example: Cashier Sale

Jane is a cashier.

```text
Jane
 |
Membership
 |
ABC Hardware
 |
Role: Cashier
 |
Permission: sales.create
```

Jane creates a sale.

Tawala verifies:

```text
Jane authenticated        ✓
ABC Hardware membership   ✓
Membership active         ✓
sales.create               ✓
Branch authorized          ✓
Products belong to tenant ✓
```

The sale proceeds.

The action is audited as appropriate.

---

# 65. Example: Cross-Tenant Attack

Jane attempts to access:

```text
Business B
Invoice INV-900
```

The request may contain a valid invoice ID.

But:

```text
Jane authenticated        ✓
Business B membership     ✗
```

The request is denied.

It does not matter that:

```text
INV-900 exists
```

or that Jane knows its identifier.

---

# 66. Example: Cross-Branch Access

Jane has:

```text
Business A
Role: Branch Manager
Scope: Embu
```

Jane attempts to edit Nairobi inventory.

```text
Business membership       ✓
Permission                ✓
Resource belongs to       ✓
Branch scope              ✗
```

The operation is denied.

---

# 67. Example: Permission Escalation

A cashier attempts to change their own role to Owner.

```text
Authenticated             ✓
Business membership       ✓
Request valid             ✓
users.roles.manage        ✗
```

The operation is denied.

A client cannot elevate its own privileges.

---

# 68. Security Model for Multiple Clients

All clients use the same security model.

```text
              TAWALA SECURITY
                    |
        +-----------+-----------+
        |           |           |
      Desktop      Web       Mobile
        |           |           |
        +-----------+-----------+
                    |
              Tawala API
                    |
              Authorization
```

There must not be a weaker security model simply because an operation came from Desktop.

---

# 69. Offline Security

Offline support introduces additional risks.

When Desktop eventually supports offline operation, the system must determine:

```text
What can be performed offline?
How long can access remain valid?
What happens when permissions change?
What happens when a membership is revoked?
What happens when a device is stolen?
How are offline actions authenticated?
How are conflicts handled?
```

Offline authorization should be designed as its own security subsystem.

It must not weaken the normal tenant security model.

---

# 70. Device Trust

Future clients may support registered devices.

A business may be able to see:

```text
Device
User
Last activity
Platform
Status
```

A device may be revoked.

This is particularly useful for:

* Desktop POS terminals
* Mobile devices
* Shared business computers

---

# 71. Session Revocation

A business administrator should eventually be able to revoke access.

Examples:

```text
Revoke user
Revoke device
Revoke session
Revoke membership
```

This is important when:

```text
Employee leaves
Phone is lost
Computer is compromised
Credentials are suspected to be compromised
```

---

# 72. Security Monitoring

The platform should be capable of detecting unusual activity.

Potential signals:

```text
Repeated failed logins
Rapid permission changes
Unusual access patterns
Repeated denied requests
Large numbers of refunds
Unusual stock adjustments
Unexpected device activity
```

Detection and response can evolve over time.

---

# 73. Security Does Not Mean Complexity Everywhere

The security architecture should be strong without making ordinary business operations painful.

For a cashier:

```text
Login
→ Sell
→ Receive payment
→ Finish
```

should remain fast.

Security should operate mostly behind the scenes.

More friction should appear when the operation is genuinely sensitive.

---

# 74. Core Security Rules

The following rules are considered foundational:

```text
1. Every protected request must have an authenticated identity.

2. Business access requires an active membership.

3. Permissions are granted through authorization rules.

4. Access is denied by default.

5. Tenant boundaries are enforced server-side.

6. Client-provided identifiers are never trusted as proof of access.

7. Scope restrictions must be enforced.

8. Sensitive actions must be auditable.

9. Audit history must be protected.

10. Privilege escalation must be prevented.

11. Business data must not leak through errors or resource discovery.

12. Integration credentials must remain isolated.

13. Internal components must not automatically be trusted.

14. Desktop, Web, and Mobile use the same authorization model.

15. Security decisions belong to the platform, not the client.
```

---

# 75. Security Architecture Summary

The complete model:

```text
                         USER
                           |
                    AUTHENTICATION
                           |
                        IDENTITY
                           |
                     MEMBERSHIP
                           |
                        BUSINESS
                           |
                         ROLE
                           |
                      PERMISSION
                           |
                         SCOPE
                           |
                 RESOURCE AUTHORIZATION
                           |
                   BUSINESS RULES
                           |
                       OPERATION
                           |
                         EVENT
                           |
                         AUDIT
```

Every protected operation passes through the appropriate parts of this chain.

---

# 76. What Security Protects

The security model protects:

```text
Identity
Businesses
Customers
Suppliers
Employees
Products
Services
Inventory
Sales
Purchases
Payments
Accounting
Reports
Files
Integrations
Configuration
Audit records
```

The protection applies regardless of which client is being used.

---

# 77. What We Are Not Deciding Yet

This document does not yet choose:

```text
JWT vs session cookies
OAuth provider
Password hashing library
PostgreSQL RLS implementation details
Encryption library
Token format
Desktop authentication mechanism
Mobile authentication mechanism
Offline authorization implementation
Exact permission table structure
Exact database schema
```

Those belong to implementation architecture.

The security principles defined here must guide those decisions.

---

# 78. Security Acceptance Criteria

The security architecture should eventually be tested against scenarios such as:

```text
User with no membership attempts access
        → DENIED

User accesses another tenant's resource
        → DENIED

User changes tenant ID in request
        → DENIED

User guesses another resource ID
        → DENIED

User has permission but wrong branch
        → DENIED

User has correct role and scope
        → ALLOWED

User attempts privilege escalation
        → DENIED

Revoked membership attempts access
        → DENIED

Unauthorized user attempts audit modification
        → DENIED

Desktop requests unauthorized operation
        → DENIED

Mobile requests unauthorized operation
        → DENIED

Web requests unauthorized operation
        → DENIED
```

The same rules must apply regardless of client.

---

# 79. Security North Star

Tawala should make this statement true:

> **A user can access exactly what they are authorized to access, inside exactly the businesses and organizational scopes they are authorized to operate in, and important actions remain traceable.**

Not more.

Not less.

---

# 80. Final Principle

Security in Tawala is not:

```text
Login
+
Hide some buttons
```

It is:

```text
Identity
+
Tenant Isolation
+
RBAC
+
Scope
+
Resource Authorization
+
Business Rules
+
Audit
+
Defense in Depth
```

The system should be designed so that unauthorized access is difficult even when:

* A user manipulates the client
* A user changes request parameters
* A user guesses resource identifiers
* A user calls APIs directly
* A client application is compromised
* A developer accidentally forgets a normal UI restriction

The fundamental security boundary remains:

> **A business's data belongs to that business, and access must always be explicitly authorized.**

---

# 81. Architecture Status

This security model is:

**PROPOSED**

It defines the principles and conceptual security model.

Implementation details will be designed only after the domain model and security model have been reviewed.

---

# 82. Next Architectural Stage

The foundational architecture now consists of:

```text
01  TAWALA_CORE_ARCHITECTURE.md
02  TAWALA_DOMAIN_MODEL.md
03  TAWALA_SECURITY_MODEL.md
```

The next stage is no longer about describing Tawala generally.

We can now begin **engineering the actual domain boundaries**.

The next artifact should therefore define:

```text
TAWALA_DOMAIN_BOUNDARIES.md
```

That document will answer:

```text
What belongs in Core?

What belongs in Sales?

What belongs in Inventory?

What belongs in CRM?

What belongs in Purchasing?

What belongs in Payments?

What belongs in Accounting?

What belongs in specialized domains?

How do domains communicate?

What can depend on what?

What must never depend on what?
```
