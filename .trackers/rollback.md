# Rollback

Revert the PR (or reset the topic branch).

Primary files touched (expected):
- `frontend/src/app/robots.ts`
- `frontend/src/app/sitemap.ts`
- `frontend/src/app/(public)/legal/privacy/page.tsx`
- `frontend/src/app/(public)/legal/terms/page.tsx`
- `frontend/src/app/(public)/legal/policy/page.tsx`
- `frontend/src/app/(public)/onboarding/personal-details/page.tsx`
- `frontend/src/app/(public)/blog/articles.ts`
- `frontend/src/app/(public)/blog/[slug]/page.tsx`
- `frontend/src/app/(public)/support/page.tsx` (+ layout if changed)
- Solutions pages (BreadcrumbList / light internal links)
- Homepage (light internal links / proof only if changed)

No DB migration. No backend contract changes. Rollback is a clean git revert of the PR.
