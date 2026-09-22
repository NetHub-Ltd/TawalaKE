# Task

## Goal
Platform org list + hard delete with friction for test-org cleanup (issue **#297**).

## Approved scope
- GET /api/v1/platform/organizations (+ optional active, q, pagination)
- GET /api/v1/platform/organizations/{id}
- DELETE /api/v1/platform/organizations/{id} with:
  - PLATFORM_ORG_HARD_DELETE flag (default false)
  - SUPER_ADMIN only
  - confirm_name exact match + confirm_phrase == DELETE + reason
  - ordered cascade hard delete + platform audit
  - rate limit 5/hour

## Roadmap issues (do not drift)
1. #297 — org list + hard delete (this branch) in progress
2. #298 — platform login email MFA
3. #299 — /platform/login two-step UI
4. #300 — platform orgs admin UI + delete modal
5. #301 — cleanup window runbook (enable flag, purge, disable)

## Out of scope (this PR)
- MFA / login UI
- Soft-delete product flow
- Impersonation
- Frontend

## Verification
- Unit tests: test_platform_org_hard_delete.py
- Flag default off
- SUPPORT cannot hard-delete

## Debt
- Hard delete is temporary; after cleanup set flag false and prefer soft-delete (#301).
