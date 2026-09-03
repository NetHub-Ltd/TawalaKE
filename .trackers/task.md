# Task Tracker

**Branch:** `feat/staff-invite-email`  
**Base:** `dev` (includes PR #163 password recovery)  
**PR target:** `dev`  
**Tier:** 2  

## Goal
Anyone with ORG_STAFF_MANAGE creates staff without a password; system emails invite; staff sets password via link; expired links only renewable by managers with ORG_STAFF_MANAGE (permission-based, not ADMIN role).

## Done
- [x] Security: staff invite token create/consume + reverse index (48h)
- [x] mailer.send_staff_invite (logo at tawala.nethub.co.ke/logo.svg)
- [x] StaffCreateManagedIn without password; pending create
- [x] POST /staff + POST /staff/{id}/resend-invite
- [x] POST /auth/staff-invite/accept
- [x] Frontend create form, pending status, resend UI, accept page + BFF

## Out of scope
- Platform roles
- Public self-resend
