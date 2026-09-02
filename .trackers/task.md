# Task Tracker

**Branch:** `feat/seo-marketing-readiness`  
**Base:** `main` @ `d0c29ae`  
**PR target:** `dev`  
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

## Remaining
- [ ] Frontend build verification
- [ ] Push branch + open PR to `dev`
- [ ] Create remote `dev` from main if absent

## Active follow-ups
- Replace illustrative/early owner quotes with verified testimonials
- Supply real phone / address / social URLs for richer Organization schema
- Consider public pricing page (plans currently auth-gated)
- Optionally restore/live solutions index linking to industry pages
- Marketing actions: GBP, directories, WhatsApp Business, review collection

## Risks
- Public surface expansion — must pass Next.js build
- Schema accuracy — no false contact data
- Solutions index still largely commented; industry pages are standalone

## Verification
- `npm run build` (frontend) succeeds
- New routes render; invalid blog slug → 404
- Sitemap lists industry + blog paths
- JSON-LD present without placeholder phone/sameAs

## Debt introduced
None deliberate.

## Design decisions
- Extended existing tokens (`text-h1/h2/h3`, Button, brand-primary, card borders) — no new visual language
- FAQ uses native `<details>` for zero JS dependency and accessibility
- Trial CTAs remain `/onboarding/personal-details`
