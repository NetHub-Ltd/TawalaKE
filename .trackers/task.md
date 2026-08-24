# Task Tracker

**Task Name:** Initial Repository Inspection
**Goal:** Establish Engineer Mode tracking and understand repository state
**Approved Scope:** Repository inspection, tracker initialization, state documentation

## Proposed Changes
- [ ] None yet — awaiting user task assignment

## Approved Changes
- [x] Initialize `.trackers/` directory
- [x] Record repository state

## Completed Changes
- [x] Cloned repository from GitHub
- [x] Inspected repository structure
- [x] Identified tech stack and architecture
- [x] Identified CI/CD pipeline
- [x] Identified commented-out routes and version drift

## Remaining Changes
- [ ] Awaiting user-defined task scope

## Explicitly Out of Scope
- None defined yet

## Decisions Made
- Repository uses `main` as default branch
- Authentication via fine-grained PAT
- No `.trackers/` existed; initialized fresh

## Decisions Still Required
- What task should be undertaken?
- Deployment target confirmation (GHCR only, or also VPS/K8s?)

## Relevant Risks
- Several core routes (sales, payments, staff) are disabled — may indicate incomplete features or intentional hold
- Version drift between git tags and `pyproject.toml` could cause confusion in CI
- No `.env.example` makes local setup difficult for new developers
