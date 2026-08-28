# Skill: Security & Privacy by Design

## Purpose
Build systems that protect data, users, and infrastructure by default.

## Input validation
- Never trust client input. Validate at the API boundary with Pydantic.
- Re-validate inside the service layer for business rules.
- Sanitize file names, paths, and user-generated content before storage or rendering.

## SQL injection
- Use parameterized queries or an ORM (SQLAlchemy) exclusively.
- Never concatenate user input into SQL strings.
- Validate sort/filter column names against a whitelist.

## XSS & output encoding
- Escape all user-generated content before rendering in HTML.
- Use a Content Security Policy (CSP) header to mitigate inline script injection.
- Avoid `dangerouslySetInnerHTML` or equivalent raw HTML insertion.

## CSRF
- Use `SameSite=Lax` or `SameSite=Strict` cookies.
- For state-changing operations, require anti-CSRF tokens if using cookie-based auth.

## Authentication (AuthN)
- Use OAuth2 / OpenID Connect for third-party auth when possible.
- For JWT: use short access-token lifetimes (15 min), rotate refresh tokens, store them securely (httpOnly cookies or secure storage).
- Hash passwords with **Argon2id** or **bcrypt**; never roll your own crypto.
- Implement brute-force protection: rate-limit login attempts and add exponential backoff.

## Authorization (AuthZ)
- Enforce authorization at the API layer, not just the UI.
- Use RBAC (roles) or ABAC (attributes) consistently.
- Apply the principle of least privilege: grant the minimum permissions required.
- Validate resource ownership on every mutating endpoint (`ensure_user_owns_resource`).

## Secrets management
- Store secrets in environment variables or a secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler).
- Never commit secrets, API keys, or `.env` files to version control.
- Rotate secrets regularly and after any suspected breach.

## Transport security
- Enforce HTTPS/TLS in all environments except local development.
- Use HSTS headers with a long max-age.
- Disable weak TLS versions (1.0, 1.1) and weak cipher suites.

## Rate limiting
- Apply per-IP and per-user rate limits on all public endpoints.
- Use stricter limits on authentication endpoints.
- Return `429 Too Many Requests` with a `Retry-After` header.

## Data privacy
- Collect only data you need (data minimization).
- Encrypt sensitive data at rest (database-level encryption or application-level encryption for PII).
- Mask or tokenize PII in logs and error reports.
- Honor deletion requests; hard-delete PII when legally required, soft-delete for operational recovery.
- Document data retention policies and enforce them.

## Dependency & supply chain
- Pin dependency versions and use a lock file (`poetry.lock`, `uv.lock`, `requirements.txt` with hashes).
- Scan dependencies for known vulnerabilities (`safety`, `pip-audit`, Snyk, Dependabot).
- Keep the base Docker image minimal and updated.

## Logging & monitoring
- Log security events: failed logins, permission denials, unusual request patterns.
- Do not log passwords, tokens, or PII.
- Forward logs to a SIEM or centralized logging system.
- Set up alerting for anomalies (spike in 401/403 responses, repeated login failures).
