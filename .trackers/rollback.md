# Rollback — Core V2

## Previous known-good product state

- **Product branch:** `main` @ `79f91d5`
- **Product integration:** `dev` (unaffected by this branch)

## How to abandon Core work

1. Do **not** merge `core/v2` into `main` or `dev`.
2. Optionally delete remote branch: `git push origin --delete core/v2`
3. Delete local branch: `git branch -D core/v2`
4. Product continues on `main` / `dev` unchanged.

## Irreversible operations

- None affecting product data or production deploy.
- Clean-slate commit only removed files **on this branch**.

## Data / migrations

- No migrations on this branch yet.
- No production data touched.
