# Path A — PlatformUser ↔ NetHubKe membership (#540)

**Zero-breakage:** never rewrite `platform_users.id`. Link only.

## Prerequisites

1. NetHubKe Path A merged (memberships + `GET /access/{product}`, product `tawala-platform`).
2. Tawala migration `m6n7o8p9q0r1` applied (`platform_users.nethub_user_id`).
3. Platform operators exist in Zitadel with the **same emails** as `platform_users.email`.

## Steps

### 1. Export from Tawala

```bash
cd backend
uv run python scripts/path_a_export_platform_users.py --out /tmp/platform_export.json
```

### 2. Create memberships in NetHubKe (dry-run then apply)

```bash
cd apps/backend   # NetHubKe
uv run python scripts/path_a_link_platform_memberships.py \
  --in /tmp/platform_export.json \
  --out /tmp/platform_mapping.json

# review mapping, then:
uv run python scripts/path_a_link_platform_memberships.py \
  --in /tmp/platform_export.json \
  --out /tmp/platform_mapping.json \
  --apply
```

Creates (idempotent):

- NetHubKe `users` (+ personal tenant if needed)
- `memberships` for product `tawala-platform` with `external_user_id = platform_users.id`

### 3. Store NetHub user id on Tawala (optional convenience)

```bash
cd backend   # Tawala
uv run python scripts/path_a_apply_platform_links.py --in /tmp/platform_mapping.json
uv run python scripts/path_a_apply_platform_links.py --in /tmp/platform_mapping.json --apply
```

### 4. Prove establish

With `AUTH_OPAQUE_SESSION_V1=true` and `AUTH_NETHUB_ACCESS_URL` set:

1. Obtain Zitadel access token for a linked platform email.
2. `POST /api/v1/platform/auth/session/nethub` with `Authorization: Bearer <token>`.
3. `GET /api/v1/platform/auth/me` with session cookie.

## Safety

| Guard | Behavior |
|-------|----------|
| Dry-run default | Scripts do not write until `--apply` |
| FK | `external_user_id` / session principal stay `platform_users.id` |
| MFA | Legacy platform login remains default until you rely on nethub path |
| Fail closed | Establish 403 if membership or PlatformUser missing |

## Zitadel

Provisioning IdP accounts is **out of band** (console or your IdP automation). Emails must match.
