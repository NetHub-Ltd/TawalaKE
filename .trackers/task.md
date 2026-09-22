# Task

## Goal
#300 — Platform orgs admin UI with hard-delete friction modal.

## Product intent
Operators need to find and permanently remove test orgs after cleanup, without accidental deletes.

## Evidence
- API exists on dev (#297): GET/DELETE /api/v1/platform/organizations
- Friction contract: confirm_name, phrase DELETE, reason; flag PLATFORM_ORG_HARD_DELETE

## Approach
- /platform/orgs list + search
- Modal friction matching API
- Auth via platform sessionStorage token
- Branched from feat/platform-login-ui (#299)

## Out of scope
MFA API (#298), soft-delete product flow, create/update org forms

## Risks
Hard delete irreversible; flag must stay off outside cleanup window (#301)
