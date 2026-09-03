# Rollback

**Previous known-good:** `main` @ `5184536` (Merge PR #162)

## This branch
Revert the PR or restore:

### Backend
- `backend/app/core/config.py` (restore optional default for `frontend_url` if needed)
- `backend/app/api/routes/auth.py` (frontend URL construction)
- `backend/app/api/routes/organization.py` (`_frontend_base_url`)

### Frontend
- Remove `frontend/src/app/(public)/forgot-password/`
- Remove `frontend/src/app/(public)/auth/reset-password/`
- Remove `frontend/src/app/api/v1/auth/forgot-password/`
- Remove `frontend/src/app/api/v1/auth/password-reset/confirm/`
- Remove `frontend/src/lib/auth/password-policy.ts`
- Remove `frontend/src/features/auth/components/ForgotPasswordForm.tsx`
- Remove `frontend/src/features/auth/components/ResetPasswordForm.tsx`
- Restore prior `LoginForm.tsx`, `SetPasswordForm.tsx`, onboarding page step labels

No DB migration. No data migration.

**Note:** After merge, ensure k3s/env still provides `FRONTEND_URL`; removing the requirement is the only rollback that re-allows missing env.
