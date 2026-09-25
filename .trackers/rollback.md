# Rollback

## General
- Prefer **revert merge commit on `dev`** for a single PR rather than force-push
- Never force-push `main` / production tags without explicit approval

## Receipt print (#399)
- Revert PR restores prior print path
- No DB migration

## Tax gate (#395)
- Flip `TAX_FEATURE_ENABLED` only when tax is fully productized
- Revert returns prior tax_on / rate behavior from business settings

## Terminal services/discount (#390/#394)
- Revert may reintroduce schema strip of `services`/`discount` on initialize
- Staged sales created after those merges keep stored totals; old rows unchanged

## Org hard-delete (#383)
- Revert removes analytics pre-delete; org delete can FK-fail again on `sale_analytics_summaries`

## MFA / platform (historical)
- Revert platform MFA independently of BFF allowlist login paths
