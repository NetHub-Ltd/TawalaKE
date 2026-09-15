# Hard-session token claim contract (M0 / #221)

**Version:** 1.0  
**Parties:** NetHubKe (issuer / exchange AS) → TawalaKE (resource server)  
**Transport:** `Authorization: Bearer <access_token>`  
**Verification on Tawala:** local JWKS only (cached). **No** per-request HTTP call to NetHubKe or Keycloak on POS hot paths.

---

## 1. Token types

| Kind | Issuer | Used for | Tawala flag |
|------|--------|----------|-------------|
| **Legacy staff** | Tawala (`iss` = Tawala settings) HS256 | Current staff APIs | Always (until M9) |
| **Hard session** | NetHubKe exchange (or agreed ISS) RS256 | Org-scoped terminal/owner session | `AUTH_HARD_SESSION_V2` |
| **Soft session** | Tawala only | Active `Staff` on device | `AUTH_PIN_SOFT_SESSION` |

This document freezes **hard session** claims. Soft session is Tawala-local (cookie or `kind=staff_soft` JWT) and is **not** issued by NetHubKe.

---

## 2. Required hard-session claims

| Claim | Type | Required | Description |
|-------|------|----------|-------------|
| `iss` | string | yes | Exactly NetHubKe / configured hard-session issuer URL |
| `aud` | string or array | yes | Must include `tawala-api` (configurable; default name frozen here) |
| `sub` | string | yes | Keycloak subject of the human or terminal principal who performed hard auth |
| `exp` | number | yes | Unix expiry; Tawala rejects expired tokens (small leeway e.g. 10s) |
| `iat` | number | yes | Issued-at |
| `org_id` | string (UUID) | yes | Tawala `Organization.id` this session is bound to |
| `principal` | string enum | yes | `owner` \| `terminal` |
| `jti` | string | recommended | Unique id for revoke/blocklist if implemented later |

### Optional claims

| Claim | Description |
|-------|-------------|
| `email` | Owner contact; not used for staff RBAC |
| `scope` / `permissions` | Ecosystem scopes; Tawala may ignore if org_id + principal suffice |
| `entitlements` | e.g. product codes; paywall may still use Tawala DB as source of truth |

---

## 3. Explicit non-claims (do not put in hard token)

| Do **not** include | Why |
|--------------------|-----|
| Cashier `staff_id` | Staff switch is PIN soft session on Tawala only |
| Staff role (CASHIER/MANAGER/…) | Comes from Tawala `Staff.role` after PIN |
| Per-sale permissions | Tawala RBAC |
| NetHub internal user PK as only org key | Use `org_id` aligned with Tawala Organization UUID |

---

## 4. `principal` semantics

| Value | Meaning | Typical PIN policy |
|-------|---------|---------------------|
| `owner` | Billing / HQ actor for this org | PIN optional (M6) |
| `terminal` | Shared device hard session for the org | PIN required for POS writes when dual-gate on |

---

## 5. Algorithm & validation (Tawala)

- **Alg:** RS256 (asymmetric). HS256 legacy staff tokens remain separate path.
- **Keys:** JWKS URL from config (`AUTH_HARD_JWKS_URL` or derived from issuer).
- **Checks:** signature, `exp`, `iss` allowlist, `aud` contains `tawala-api`, `org_id` present and UUID-shaped.
- **Cache:** JWKS cached in process/redis with TTL; failure to refresh must not silently accept bad signatures.

---

## 6. Mapping from Keycloak (NetHubKe responsibility)

| Keycloak | Hard token |
|----------|------------|
| `sub` | `sub` |
| Org membership / NetHub org link | `org_id` (Tawala UUID — NetHub must store or resolve this link) |
| Role/group indicating owner | `principal=owner` |
| Terminal or store-open role | `principal=terminal` |
| Realm roles SUPER_ADMIN etc. | **Out of scope** for this contract (platform tokens separate) |

Cashiers are **not** provisioned in NetHub. Keycloak may authenticate a manager once; Tawala PIN selects which `Staff` row is active.

---

## 7. Compatibility with legacy staff JWT

Legacy Tawala access token (illustrative):

| Claim | Legacy staff |
|-------|----------------|
| `sub` | Staff UUID |
| `organization_id` | Org UUID |
| `role` | OWNER/ADMIN/MANAGER/CASHIER |
| `kind` | `staff` (or absent) |

When `AUTH_HARD_SESSION_V2` is off, only legacy verification runs. When on, verifier accepts **either** valid legacy **or** valid hard session; route-level dual-gate is a later flag.

---

## 8. Versioning

Breaking claim changes require a new contract version and coordinated NetHubKe + Tawala flags. Additive optional claims are allowed without bumping major version.
