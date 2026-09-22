# Platform org hard-delete — cleanup window runbook

**Issue:** [#301](https://github.com/NetHub-Ltd/TawalaKE/issues/301)  
**Related:** API [#297](https://github.com/NetHub-Ltd/TawalaKE/issues/297), MFA [#298](https://github.com/NetHub-Ltd/TawalaKE/issues/298), UI [#299](https://github.com/NetHub-Ltd/TawalaKE/issues/299)–[#300](https://github.com/NetHub-Ltd/TawalaKE/issues/300)

## Purpose

Temporarily enable **irreversible** organization hard-delete so operators can remove **test / orphan** orgs, then **disable** the capability again so production cannot accidentally wipe tenants.

This is **not** the long-term product delete/archive flow. Prefer soft-delete/archive for productized deletion later.

## Preconditions (do not skip)

| Check | Why |
|--------|-----|
| You are operating on the intended environment (staging first) | Avoid prod mistakes |
| Database backup / snapshot taken (or point-in-time recovery known) | Hard delete cannot be undone from the app |
| Platform Slice A deployed (`platform_users`, `/api/v1/platform/*`) | Identity + routes |
| Hard-delete API deployed (#297) | `DELETE /api/v1/platform/organizations/{id}` |
| At least one **SUPER_ADMIN** platform user bootstrapped | Delete is SUPER_ADMIN-only |
| List of **candidate org names/ids** agreed as test-only | Prevent deleting real customers |
| `PLATFORM_ORG_HARD_DELETE` currently **false** (default) | Confirm baseline before the window |

**Optional but recommended**

- MFA login API (#298) and `/platform/login` + `/platform/orgs` UI (#299–#300) for safer operator workflow
- Second person review of the candidate list before any delete

## Safety model (OBSERVED in code)

- Flag: `settings.platform_org_hard_delete` ← env **`PLATFORM_ORG_HARD_DELETE`** (default **`false`**)
- Role: **SUPER_ADMIN** only (plus `platform:orgs:write`)
- Body friction: `confirm_name` must match org name exactly; `confirm_phrase` must be exactly `DELETE`; `reason` required (≥3 chars)
- Rate limit: **5/hour** on the delete endpoint
- Audit action: `platform.orgs.hard_delete` (outcomes include `success`, `denied_flag_off`, `denied_role`, `denied_name_mismatch`, `error`)

When the flag is off, delete returns **403** with code `HARD_DELETE_DISABLED`.

## Window procedure

### 1. Freeze the candidate list

Record in a ticket or secure note:

```text
env: staging | production
operator: <email>
window start (UTC): …
candidates:
  - id=… name=… email=… reason=test cleanup
  - …
```

Only names on this list may be deleted during the window.

### 2. Enable the flag (short window)

Set in the target environment only:

```bash
PLATFORM_ORG_HARD_DELETE=true
```

Restart / roll the API so settings reload. Confirm elsewhere still has the flag **false**.

### 3. Authenticate as SUPER_ADMIN

**If MFA is deployed (#298):**

```http
POST /api/v1/platform/auth/login
{ "email": "…", "password": "…" }
→ challenge_id

POST /api/v1/platform/auth/verify-code
{ "challenge_id": "…", "code": "……" }
→ access_token
```

Or use UI: `/platform/login` → code → `/platform/orgs`.

**If MFA is not yet deployed:** password login may still return a token (pre-#298). Prefer completing MFA before prod cleanup.

### 4. List and match candidates

```http
GET /api/v1/platform/organizations?q=<name-or-email>&limit=50
Authorization: Bearer <platform_token>
```

Or UI: `/platform/orgs` search. Confirm **id + name + email** match the candidate list.

### 5. Hard-delete one org at a time

```http
DELETE /api/v1/platform/organizations/{organization_id}
Authorization: Bearer <platform_token>
Content-Type: application/json

{
  "confirm_name": "<exact organization.name>",
  "confirm_phrase": "DELETE",
  "reason": "test cleanup — ticket …"
}
```

UI: **Hard delete** → type exact name → type `DELETE` → reason → **Delete forever**.

After each success:

- Note response `pre_delete_counts` (sales/staff/businesses)
- Confirm org no longer appears in list
- Optionally verify audit row `platform.orgs.hard_delete` / `outcome=success`

Stop the window if any unexpected name, high sales counts, or uncertain row appears.

### 6. Disable the flag immediately

```bash
PLATFORM_ORG_HARD_DELETE=false
```

Reload/restart API. Verify:

```http
DELETE /api/v1/platform/organizations/{any-remaining-test-id}
…
→ 403 HARD_DELETE_DISABLED
```

### 7. Close the window

Record:

```text
window end (UTC): …
deleted: [ids…]
skipped: [ids… + reason]
flag: false (confirmed)
backup reference: …
```

## Failure handling

| Symptom | Action |
|---------|--------|
| 403 `HARD_DELETE_DISABLED` | Flag still off or not reloaded |
| 403 role | Use SUPER_ADMIN, not SUPPORT |
| 400 `CONFIRM_NAME_MISMATCH` | Copy name from GET response exactly |
| 400 phrase | Must be exactly `DELETE` (case-sensitive) |
| 500 `HARD_DELETE_FAILED` | Check API logs; stop deletes; restore from backup if partial |
| High `pre_delete_counts.sales` on a “test” org | **Stop** — treat as possible real tenant |

Partial cascade failure is a stop-the-line event: disable the flag, investigate, restore from backup if needed.

## After cleanup (product follow-up)

- Keep hard delete **disabled** by default forever unless a new explicit window is approved
- Build proper **soft-delete / archive** for product flows (not this tool)
- Do not leave `PLATFORM_ORG_HARD_DELETE=true` in production env files or secrets managers

## Quick checklist

```text
[ ] Backup / recovery path known
[ ] Candidate list reviewed
[ ] SUPER_ADMIN available
[ ] Flag set true only on target env
[ ] Deletes completed for list only
[ ] Audit outcomes checked for successes
[ ] Flag set false and verified with a 403
[ ] Window notes filed
```
