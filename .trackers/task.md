# Task: Customer management workspace

## Status
Implementing / ready for PR

## Done
- Backend schemas, CRUD, routes `/api/v1/customers`
- Aggregates: open credit, lifetime revenue
- Soft-delete blocked when open credit
- Phone normalize + duplicate phone 409
- Paywall: customer_management OR pos_and_sales
- FE BFF proxies, CustomersWorkspace list+detail, sidebar nav
- Page `/org/.../customers`

## Out of scope
CSV import, CRM notes, statements, terminal preselect
