# Task

## Goal
Platform operator dashboard home — KPIs + attention list (issue **#386**, parent epic **#385**).

## Scope
- Replace thin `/platform` summary with attention-first operator home
- KPI row: orgs, active, inactive, businesses, staff (from existing list API)
- Attention list: inactive orgs; orgs with grace ending ≤7d when subscription data present
- Quick actions: Manage orgs; link toward users page (page lands in #388)
- Expose `grace_end_date` + `access_phase` on platform org subscription serialize (needed for attention)
- Clear empty/error/loading states; no tenant chrome leakage

## Out of scope
- Orgs filters + extend-grace UI (#387)
- Operators users page (#388)
- Plans/billing read views, audit stream, impersonation (Phase B/C)

## Branch
feat/platform-dashboard-home → PR into **dev**
