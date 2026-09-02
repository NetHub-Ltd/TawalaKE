# Task Tracker

**Branch:** `feat/onboarding-auto-ndovu-trial`  
**Base:** `main`  
**PR target:** `dev`  
**Tier:** 2

## Goal
After account creation and email verification (set password), auto-start a **14-day Ndovu** trial with frictionless UI and professional emails.

## Approved scope
- `TRIAL_DAYS = 14`; Basic/Ndovu seed `trial_days: 14`
- Auto-start NDOVU trial in `POST /auth/onboarding/set-password`
- TokenResponse hints: trial_started, trial_days, plan_code, needs_org_profile
- SetPasswordForm routing: org profile or /org; plans only on trial failure
- Setup + trial email templates (conversion-focused)
- Onboarding UI copy (personal-details, set-password, plans recovery)
- PlanCard / StartTrialButton 14-day labels
- docs/billing.md trial policy

## Out of scope
- Cancel flow UI
- Public pricing page
- Auto-create first store
- Payment provider changes

## Completed
- [x] Backend trial duration + seed
- [x] Auto-trial on set-password
- [x] Email templates
- [x] Frontend routing + copy
- [x] Billing doc

## Remaining
- [ ] Push + PR to dev
- [ ] CI / manual verification of happy path

## Verification
- set-password → active NDOVU sub ~14 days
- needs_org_profile → /onboarding/organization
- trial failure → /onboarding/plans
- Emails: setup CTA + trial active subjects

## Debt introduced
None deliberate.
**Branch:** `feat/seo-marketing-readiness`  
**Base:** `main` @ `d0c29ae`  
**PR target:** `dev`  
**PR:** https://github.com/NetHub-Ltd/TawalaKE/pull/156  
**Tier:** 2

## Goal
Raise organic discovery and conversion readiness for cold Kenyan shop owners via industry pages, structured data, blog foundation, sitemap, and homepage FAQ.

## Approved scope
- Industry pages: `/solutions/retail`, `/pharmacy`, `/hardware`, `/wholesale`
- Blog: `/blog`, `/blog/[slug]`, static `articles.ts` (4 seed articles)
- Homepage: Organization + Product + FAQPage JSON-LD; visible FAQ accordion; Blog footer link; softened social-proof note
- Sitemap: all new public routes + blog slugs
- Support: metadata via `support/layout.tsx`
- Trackers realigned to this task

## Explicitly out of scope
- Google Business / social account creation / directory submissions (human marketing actions)
- Invented phone numbers, addresses, or `sameAs` URLs
- Restoring the fully commented solutions index redesign
- Backend, auth, billing, eTIMS, k3s deploy changes
- Real customer testimonials (follow-up)

## Completed
- [x] Topic branch created
- [x] Industry landing pages (4)
- [x] Blog index + [slug] + articles data
- [x] Sitemap updated
- [x] Homepage schemas + FAQ + footer Blog link
- [x] Support layout metadata
- [x] Trackers updated
- [x] Remote `dev` created from `main`
- [x] PR #156 opened to `dev`

## Remaining
- [ ] CI / `npm run build` on runner (local npm install failed with 502 in agent sandbox)
- [ ] User review and merge

## Active follow-ups
- Replace illustrative/early owner quotes with verified testimonials
- Supply real phone / address / social URLs for richer Organization schema
- Consider public pricing page (plans currently auth-gated)
- Optionally restore/live solutions index linking to industry pages
- Marketing actions: GBP, directories, WhatsApp Business, review collection

## Risks
- Public surface expansion — confirm CI frontend build green
- Schema accuracy — no false contact data
- Solutions index still largely commented; industry pages are standalone

## Verification
- Code review of 13 files / +1184 lines
- Local syntax checks on articles/sitemap
- Full Next build deferred to CI due to sandbox npm registry 502

## Debt introduced
None deliberate.

## Design decisions
- Extended existing tokens (`text-h1/h2/h3`, Button, brand-primary, card borders) — no new visual language
- FAQ uses native `<details>` for zero JS dependency and accessibility
- Trial CTAs remain `/onboarding/personal-details`
