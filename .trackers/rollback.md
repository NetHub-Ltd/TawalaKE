# Rollback

**Current main HEAD:** `69fe068` (Merge PR #97 — test suite + CI)  
**Previous main before PR #97 content:** parent of merge; last pre-suite feature baseline was around inspection-report merge `0eb93d0` era  
**Production image stream:** `ghcr.io/NetHub-Ltd/tawala-api` (tags per release process; PR #97 did not change runtime image code)

## What PR #97 changed
- `backend/testing/**` only (plus CI workflow + trackers)
- **No** `backend/app/**`, frontend, migrations, or Docker image contents

## Rollback procedure (if tests/CI must be removed)
1. `git revert -m 1 69fe068` on a branch, or revert the test commits individually
2. Optionally delete `.github/workflows/test_backend.yml` if CI gate must be disabled
3. **Runtime / k3s:** no action required — production behavior unchanged by PR #97

## Data / migration
- None — tests only

## Recovery notes
- Suite can be re-run from `backend/testing/` + env vars in `.trackers/task.md`
- CI template also under `.trackers/ci-workflow-template.md` (historical)
