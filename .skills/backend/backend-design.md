# Skill: Backend Design Practices

## Purpose

Design and change backend systems that are correct, secure, operable, and aligned with product jobs—FastAPI, PostgreSQL/Alembic, auth, and tests in this repository’s stack.

**Load when:** any API, schema, migration, authz, background task, or backend test change. **Security section is non-optional** whenever this skill is loaded.

## API design (FastAPI)

- Resource-oriented URLs; correct HTTP methods; plural collections; consistent status codes (200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500).
- Separate schemas for Create / Read / Update / List; document fields; do not leak sensitive internals.
- `Depends()` for DB, auth, config; yield sessions with cleanup; keep dependencies testable.
- `async def` for I/O-bound work; do not block the event loop with heavy CPU work.
- Raise domain-appropriate errors; stable error JSON shape; log detail server-side; sanitize client messages.
- CORS: explicit origins in production; never `*` with credentials.
- OpenAPI as a contract; keep it accurate for clients (e.g. Orval).

## Database design

- Model for real access patterns; explicit constraints and indexes that match queries.
- Prefer additive, reversible migrations; document breaking changes; no silent schema breaks.
- Avoid N+1; be explicit about transactions for multi-step writes.
- Multi-tenant boundaries enforced in queries and policies—not only in the UI.

## Security & privacy (required)

- AuthN and AuthZ on every sensitive route; least privilege; PIN/JWT patterns as used by the product.
- Validate and constrain all inputs; never trust client-supplied tenancy or role claims without verification.
- Secrets from environment/orchestrator—never commit secrets or `.env` with credentials.
- Rate limit and lock out sensitive endpoints appropriately; TLS in production paths.
- Minimize PII in logs; never log tokens, passwords, or full payment payloads.

## Testing & QA

- Pytest for unit and API tests; TestClient/integration where behavior crosses layers.
- Fixtures and factories for realistic data; assert status codes and critical body fields.
- Do not delete or weaken tests to obtain green CI; fix or skip with documented reason.
- Cover authz negatives (forbidden access) for tenant and role boundaries.

## Operability

- Structured logging; request correlation where applicable; no secret leakage in logs.
- Health and readiness appropriate to deployment.
- Background tasks: explicit failure handling and idempotency where retries exist.

## Repository rule

Inspect existing routes, models, CRUD, migrations, and tests before proposing parallel patterns. Prefer extend over invent.

## Anti-patterns

- Verbs in URLs as a substitute for proper methods
- God schemas that mix create/read/update
- Migrations that cannot be reasoned about for rollback
- Auth only on the frontend
- Tests that only cover happy paths for security-sensitive code
