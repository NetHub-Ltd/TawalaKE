# Rollback

- **Previous known-good on dev:** 9aeaf525057c73ce383d9db808727b855ed1c6b9
- **Migration:** b2c3d4e5f6a7_add_card_other_volume_analytics (additive card_volume, other_volume)
- **Rollback code:** Revert PR on dev
- **Rollback data:** `alembic downgrade a1b2c3d4e5f7` drops the two columns (safe if unused)
- **Notes:** Discount write-path fix has no migration; re-backfill businesses if historical discounts were under-counted
