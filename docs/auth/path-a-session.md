# Path A — opaque session (PlatformUser PoC first)

**Status:** Implementation started (flags default **OFF**).  
**Program:** TawalaKE #536 · NetHubKe #135

## Rules

- Zitadel authenticates; NetHubKe authorizes (`GET /api/v1/access/{product}`).
- Tawala **forwards** the IdP Bearer once on establish; **does not** decode IdP JWTs.
- Hot path uses Redis opaque session only (random id, not a JWT).
- `principal_id` is always the domain PK (`PlatformUser.id` or `Staff.id`) — FKs unchanged.

## Config (env)

| Setting | Default | Meaning |
|---------|---------|---------|
| `AUTH_OPAQUE_SESSION_V1` | `false` | Master flag |
| `AUTH_NETHUB_ACCESS_URL` | empty | Base URL e.g. `https://api…/api/v1/access` |
| `AUTH_NETHUB_ACCESS_TIMEOUT_SEC` | `8` | Forward timeout |
| `AUTH_OPAQUE_SESSION_TTL_SEC` | `3600` | Session TTL |
| `AUTH_OPAQUE_SESSION_COOKIE_NAME` | `tawala_session` | Cookie name |
| `AUTH_NETHUB_PLATFORM_PRODUCT` | `tawala-platform` | Product slug for platform PoC |

## Session payload

```text
auth_source: nethub | legacy
principal_kind: platform | staff
principal_id: UUID string
role, exp, iat
nethub_user_id?, org_id?, email?, sub?
```

## Modules

- `app/core/opaque_session.py` — create/load/delete
- `app/api/opaque_session_deps.py` — FastAPI deps

Legacy platform MFA JWT path remains default until dual-mode wiring ships.
