# Auth sequence diagrams (M0 / #220)

These flows describe the **target** architecture. Until feature flags are enabled, production continues to use **legacy staff email/password JWT** issued by Tawala.

## Actors

| Actor | Role |
|-------|------|
| **Keycloak** | IdP — authenticates humans (password, MFA) |
| **NetHubKe** | AS — token exchange, org↔Tawala entitlement, owners/billing principals |
| **TawalaKE** | RS — local JWT verify, Staff directory, PIN soft session, RBAC/paywall |
| **Terminal UI** | Shared device browser / PWA |
| **Staff** | Cashier/manager — row only in Tawala `Staff` |
| **Owner** | Org billing principal — NetHub + Tawala OWNER staff |

---

## 1. Owner morning login (hard session)

```text
Owner          Keycloak         NetHubKe AS         TawalaKE
  |                |                 |                  |
  |-- open HQ URL ------------------------------------>|
  |<--------- redirect to login (when flag on) --------|
  |-- OIDC login -->|                |                  |
  |<-- MFA / session-|                |                  |
  |-- auth code/token --------------->|                  |
  |                |  validate KC token                  |
  |                |  check org entitled to Tawala       |
  |                |  principal=owner                    |
  |<------------- access_token aud=tawala-api -----------|
  |-- API calls with Bearer hard token ----------------->|
  |                |                 |  JWKS verify local|
  |                |                 |  org_id match     |
  |<------------------ HQ / billing data ----------------|
```

**Notes**

- NetHub remains billing system of record; Tawala paywall unchanged.
- PIN is **optional** for owner on HQ (product choice in M6).
- No cashier rows created in NetHub.

---

## 2. Shared terminal — hard session once, then PIN soft switch

```text
Manager/Staff   Keycloak      NetHubKe        TawalaKE         Terminal UI
  |                |             |               |                  |
  |-- open terminal ----------------------------------------------->|
  |-- (once) OIDC login ------------>|              |                  |
  |<-- KC session --|             |               |                  |
  |-- exchange --------------------- >|               |                  |
  |<---------- hard token aud=tawala, org_id, principal=terminal ------|
  |-- store hard session (HttpOnly/BFF); start silent refresh --------|
  |                                                                   |
  |== PIN gate (soft session) ========================================|
  |-- enter PIN ----------------------------------------------------->|
  |-- POST /auth/pin/unlock + hard Bearer --------------------------->|
  |                |             |  verify hard token                 |
  |                |             |  verify PIN vs Staff.pin_hash      |
  |                |             |  set soft session (staff_id, org)  |
  |<---------------- soft session active (short TTL) -----------------|
  |-- sales / stock with hard + soft -------------------------------->|
  |                |             |  dual-gate (when flag on)          |
  |                |             |  cashier_id := soft staff_id       |
```

**Rules**

- One hard session per device/shift is enough.
- Switching operator = PIN only, **while hard session is alive**.
- Soft session **must** die when hard session expires or logs out.

---

## 3. PIN switch mid-shift (same hard session)

```text
Staff A (active)     Staff B            TawalaKE
  |                    |                   |
  |-- lock / idle timeout ---------------->|  clear soft session
  |                    |-- enter PIN ------>|
  |                    |  unlock ---------->|  hard still valid
  |                    |<-- soft = Staff B -|
  |                    |-- create sale ---->|  cashier_id = B
```

---

## 4. Logout / hard expiry (cascade)

```text
User/UI              Keycloak         NetHubKe / refresh      TawalaKE
  |                     |                  |                     |
  |-- logout --------------------------------------------------->| clear soft
  |-- federated logout ->|                  |                     |
  |                     |  KC session end   |                     |
  |-- refresh fails ------------------------>|                     |
  |<-- re-auth required -----------------------------------------|
  |                     |                  |  any soft left wiped |
```

**Fail-closed:** refresh failure ⇒ no API writes; user must hard-login again; PIN alone is insufficient.

---

## 5. Legacy path (current production until M9)

```text
Staff -- email/password --> Tawala /api/v1/auth/login --> HS256 staff JWT
Staff -- Bearer staff JWT --> Tawala APIs (RBAC as today)
```

This path stays **on** until M8 is stable and M9 is explicitly approved. New paths ship behind flags default **off**.
