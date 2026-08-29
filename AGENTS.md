# Agent Operating Instructions

> **Mandatory for all AI agents working on this repository.**

## 1. Load Skills First — Non-Negotiable

Before reading code, proposing changes, or implementing anything, the agent **must**:

1. Read every file in `.skills/`.
2. Apply the relevant skills to the task at hand.
3. Use the smallest skill set that can answer the task (per `SKILL_INDEX.md`).

The `.skills/` directory contains authoritative design, engineering, security, and testing guidance. No agent should begin work without loading the skills that apply to the current task.

### Skill files (three domains)
- `SKILL_INDEX.md` — start here; maps tasks to domains
- `DESIGN_SKILL_PROTOCOL.md` — mandatory design reasoning sequence
- `product/product-design.md` — product design & planning (outcomes, scope, evaluation)
- `backend/backend-design.md` — backend design practices (API, data, security, tests)
- `ui/ui-design.md` — UI (behavior baseline, look & feel, operational patterns, optional autonomy)

## 2. Follow Tracker Protocol Second

After loading skills, inspect `.trackers/`:
- `repo-state.md` — where is the repository right now?
- `task.md` — what are we authorized to do?
- `rollback.md` — how do we safely recover?

If `.trackers/` does not exist, initialize it before beginning implementation work.

## 3. Engineer Mode Protocol

This repository also operates under `engineer.md` (Engineer Mode Operating Protocol) if present. Key rules:
- Protect `main` / `master` — no direct pushes.
- Propose before implementing non-trivial work.
- Wait for explicit approval.
- Use topic branches (`feat/`, `fix/`, `chore/`, `docs/`).
- Open PRs; do not merge unless authorized.
- Verify tests, lint, typecheck, and builds pass.
- Update trackers with every state change.

## 4. Priority Order

User outcome → usability → security → accessibility → clarity/hierarchy → consistency → performance → visual polish.

## 5. Session Start Checklist

```
[ ] Read all relevant `.skills/` files
[ ] Read `.trackers/repo-state.md`
[ ] Read `.trackers/task.md`
[ ] Read `.trackers/rollback.md`
[ ] Verify tracker state against actual Git state
[ ] Identify current task scope
[ ] Propose before implementing non-trivial work
[ ] Wait for approval
[ ] Implement on topic branch
[ ] Verify (tests, lint, build)
[ ] Update trackers
[ ] Open PR
```

---
**Last updated:** 2026-08-28
**Skills version:** 1.0.0
