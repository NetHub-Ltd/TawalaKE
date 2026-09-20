# Rollback — Core V2

Core lives only on `core/v2`. Product `main`/`dev` are unaffected.

## Rollback Core work
- Delete or archive remote branch `core/v2`
- Close or leave the GitHub Project "Tawala Core V2" as desired
- Old T1–T13 milestones remain closed as `[SUPERSEDED]` for history; M11–M23 milestones can be closed or left open

## Do not
- Merge `core/v2` into `main` or `dev` to "undo" — that would pollute product
- Re-open the superseded T-milestones as active work

## Tracker / milestone alignment rollback
If the M11–M23 alignment must be reversed:
- Re-open the closed T-milestones
- Move issues #264–#276 back to the T-milestones (or leave on M11–M23 and update titles)
- Revert the tracker commit on this branch
