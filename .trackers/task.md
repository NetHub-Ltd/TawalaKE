# Task Tracker

**Branch:** `deploy/onboarding-combined-test`  
**Open PR:** https://github.com/NetHub-Ltd/TawalaKE/pull/107  
**Protocol:** Engineer Mode v1.2.0

## Status
ACTIVE — deploy/test branch (user validates before merge to main)

## Latest approved task
**Scroll fix for plans / onboarding (approved 2026-08-26)**  
Root shell uses `overflow-hidden`; content must scroll inside a local region.

### Completed this change
- [x] Public layout: navbar + `flex-1 min-h-0 overflow-y-auto` content region
- [x] Plans page: remove `overflow-hidden`; `min-h-full` + bottom padding; drop scale clip
- [x] personal-details / set-password / organization: `min-h-full` + vertical padding
- [x] `/org/contact-us`: `h-full overflow-y-auto`

### Prior completed (branch history)
- [x] Task 1 A+B, Task 2, route-order 422, trial enum, plans UI, trackers resync

## Next work
None until a new written proposal is approved.

## Verification
1. `/onboarding/plans` — full card height visible via vertical scroll
2. Other onboarding steps still usable without clipping
3. Root terminal shell still non-scrolling at body level
