# Threat model: PIN soft session & shared device (M0 / #222)

**Goal of PIN:** stop one person using another staff member’s identity on a **shared terminal** while a **hard session** is already established.  
**Non-goal:** PIN is not a full authenticator, not MFA, and not a replacement for Keycloak.

---

## 1. Assets

| Asset | Sensitivity |
|-------|-------------|
| Hard session token | Org-scoped access to Tawala APIs |
| Soft session (active staff_id) | Attribution of sales; RBAC role of that staff |
| PIN hashes | Credential material at rest in Tawala |
| Sale/stock write APIs | Integrity of commercial data |

---

## 2. Trust boundaries

```text
[ Keycloak ]  hard identity
      |
[ NetHubKe ]  exchange / entitlement
      |
[ Tawala API ]  verifies hard JWT locally
      |
[ Soft session ]  staff_id after PIN
      |
[ Shared browser on till ]
```

Attackers may control: co-workers, walk-up customers near till, network on path, XSS in terminal origin, stolen device after hours.

---

## 3. Threats and mitigations

| ID | Threat | Mitigation (required in M3/M4) |
|----|--------|--------------------------------|
| T1 | **PIN-only access** after hard session expired | Soft session invalid without valid hard token; dual-gate on writes; clear soft on hard expiry/logout |
| T2 | **Brute-force PIN** | Rate limit per staff + device + IP; lockout after N failures; audit failures; delay/backoff |
| T3 | **Shoulder surfing / shared knowledge of PIN** | Idle timeout on soft session; optional re-PIN on high-risk actions later; culture + short TTL (e.g. 15–30 min idle) |
| T4 | **XSS steals tokens** | Prefer HttpOnly Secure SameSite cookies for soft (and BFF for hard); minimize tokens in `localStorage`; CSP |
| T5 | **Stolen soft session cookie** | Short TTL; bind `org_id` to hard token org; optional `device_id`; logout cascade |
| T6 | **Staff uses another’s PIN** | Same as T3; audit trail on unlock + sales; managers review |
| T7 | **Cross-org PIN unlock** | Unlock must require hard `org_id` == staff.organization_id |
| T8 | **Inactive / deleted staff PIN** | Reject unlock if `active=false` or soft-deleted |
| T9 | **Refresh keeps session forever** | Absolute max hard session length; refresh fail-closed; re-auth |
| T10 | **NetHub/Keycloak down mid-day** | Existing hard token works until `exp`; new login blocked; no weakening to PIN-only |
| T11 | **Confused deputy: platform token as hard session** | Distinct `aud` / `iss` / principal; platform routes separate |
| T12 | **Log leakage of PIN** | Never log raw PIN; audit only success/failure and staff id |

---

## 4. Explicit security rules (implementers)

1. **PIN alone never authorizes** catalog, sales, stock, or admin APIs.  
2. When `AUTH_DUAL_GATE_WRITES` is on, writes need **hard ∧ soft**.  
3. Soft session payload includes at least: `staff_id`, `org_id`, `exp` (and optionally `device_id`).  
4. PIN stored only as **Argon2 (or existing) hash + per-staff salt** — never plaintext.  
5. Unlock and lock endpoints are rate-limited and audited.  
6. Hard logout / hard `exp` / failed refresh ⇒ **destroy soft session**.

---

## 5. Residual risk (accepted)

- Collusion or voluntary PIN sharing between staff cannot be fully prevented technically.  
- Physical access to an unlocked till within soft idle window allows actions as the active staff member — mitigate with short idle TTL and lock screen UX (M5).

---

## 6. Test cues for M3/M4

- Wrong PIN → 401/403 + lockout counter  
- Other-org staff PIN → reject  
- Unlock with expired hard token → reject  
- Dual-gate on + no soft session → reject write  
- After hard logout, previous soft cookie rejected  
