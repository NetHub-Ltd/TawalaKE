# Rollback

- Previous known-good: main/dev @ 79f91d5
- Code: revert PR / delete topic branch
- Migration: `alembic downgrade b2c3d4e5f6a7` drops `platform_users` and `platform_role_enum` (destructive to platform accounts only; no tenant data)
- No tenant schema changes
- JWT: staff tokens unchanged in practice (organization_id still issued)
