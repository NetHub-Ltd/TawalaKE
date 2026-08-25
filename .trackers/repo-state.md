# Repository State

**Branch:** `feature/onboarding-ab-password-setup` (from main)
**Task:** Onboarding A+B — email verify + password setup

## Changes (this branch)
### Backend
- `app/crud/staff.py` — pending onboard (`active=False`)
- `app/api/routes/organization.py` — setup token + onboarding email
- `app/api/routes/auth.py` — set-password; login cookie fix; optional `email` on TokenResponse
- `app/core/security.py` — null password safe authenticate
- `app/core/mailer.py` — `send_onboarding_setup`

### Frontend
- Personal details + set-password UI (design tokens)
- BFF: onboarding personal-details, auth set-password

## Production notes
- Requires working `RESEND_API_KEY`, `FRONTEND_URL`, Redis for tokens
- `FRONTEND_URL` used for email links (scheme normalized if missing)
