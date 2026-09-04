# Task Tracker

**Branch:** `chore/public-navbar-clean`  
**Base:** `dev`  
**PR target:** `dev`  
**Tier:** 1  

## Goal
Replace public NavBar with a clean, typical marketing header: logo, Solutions dropdown (real routes), Blog, Pricing, Support, Sign in only — no trial button.

## Done
- [x] Rewrite `frontend/src/lib/components/NavBar.tsx`
- [x] Remove Start Free Trial (desktop + mobile)
- [x] Add Blog link
- [x] Point Pricing at `/onboarding/plans` (was `/billing`)
- [x] Solutions links → `/solutions/{retail,pharmacy,hardware,wholesale}`
- [x] Simpler brand mark; accessible focus states; mobile drawer
- [ ] PR to `dev`

## Out of scope
- Homepage / footer CTA changes
- Org app Header
- Design system overhaul
