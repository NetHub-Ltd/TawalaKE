# Task Tracker

**Branch:** `chore/seo-architecture-2026`  
**Base:** `dev`  
**PR target:** `dev`  
**Tier:** 2  

## Goal
Implement full SEO Architecture proposal: indexing & metadata hygiene, deepen existing blog content, structured data/breadcrumbs, support alignment, and sitemap/robots policy — single PR to `dev`.

## Approved decisions
- Onboarding: `noindex, follow` on form steps; keep `/onboarding/plans` indexable
- Content: deepen all 4 existing blog articles
- Support: honest static + contact channels (no fake success)
- PR shape: everything in one PR
- BreadcrumbList: ship on solutions + blog
- Host cleanup: public SEO-relevant files only

## Done
- [x] Trackers refreshed
- [x] Legal pages Metadata (title, description, canonical, OG)
- [x] Onboarding robots policy + personal-details / set-password / organization metadata (noindex)
- [x] robots.ts updates (precise allow/disallow)
- [x] Blog articles deepened + BlogPosting / truthful HowTo / BreadcrumbList
- [x] BreadcrumbList on solutions index + verticals
- [x] Support page aligned (server-rendered, honest contact + guides)
- [x] Sitemap already listed correct public URLs (no change required)
- [ ] Residual public host string cleanup (org routes left alone per scope)
- [ ] Full npm lint/build blocked by registry 502 in this environment — manual structure checks done
- [ ] PR opened to `dev`

## Out of scope
- Live Core Web Vitals measurement
- New city/keyword pages or mass content
- Competitor comparison pages
- App-shell `/org` redesign
- Backend billing/auth changes
- k3s / deployment changes
- Merge to main

## Design / SEO notes
- Schema matches visible content (HowTo only when Step N paragraphs exist)
- Practical Kenya-owner language; no keyword stuffing
- Support WhatsApp href is placeholder `wa.me/254700000000` — replace with live number before relying on it in production
