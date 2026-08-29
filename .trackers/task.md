# Task Tracker

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Base / PR target:** `dev`  
**Current branch:** `chore/skills-ui-baseline`

## Goal

Restructure `.skills/` into three domains (product, backend, UI) and add an authoritative UI skill encoding the agreed UI/UX and look-and-feel baselines. Chore only.

## Approved scope

- Three domains only: `product/`, `backend/`, `ui/`
- Author `ui/ui-design.md` (behavior + look and feel + operational patterns + optional autonomy)
- Fold prior flat skills into domain files; remove conflicting/duplicate flat files
- Update `SKILL_INDEX.md` and `AGENTS.md` pointers
- Keep `DESIGN_SKILL_PROTOCOL.md` as shared gate
- Open PR into `dev`; do not merge without explicit user authority

## Completed

- [x] Proposal approved (`proceed`)
- [x] Domain files written
- [x] Old flat skill files removed
- [x] Index and AGENTS.md updated
- [ ] PR opened into `dev`

## Remaining

- User review + merge of this PR into `dev`

## Explicitly out of scope

- Product UI screen implementation
- Backend behavior changes
- k3s / deployment
- Auto-merge

## Decisions

- Working/PR target is always `dev`
- UI baseline: job, status, recovery, trust + look-and-feel hierarchy/contrast/restraint
- Agent UX is an optional section inside UI—not a fourth domain

## Risks

- Low: documentation/agent-instruction only
- Agents that still reference old skill filenames will need the new index (AGENTS.md updated)

## Verification

- Only three domain skill bodies under `.skills/{product,backend,ui}/`
- No leftover conflicting flat skill markdown (except protocol + index)
- Diff limited to `.skills/` and `AGENTS.md` (+ trackers)
