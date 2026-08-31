# Task Tracker

**Branch:** `fix/org-staff-shell-and-bff`  
**Base:** `dev`  
**Status:** Implementing shell + BFF clarity for Team

## Goal
Team is an organization surface: org nav only (no business POS sidebar).
BFF `/api/v1/org/staff` remains sole list/create proxy to backend `/api/v1/staff`.

## Done
- [x] OrgShell for `/org/{orgId}/staff`
- [x] Remove Team from business Sidebar
- [x] Harden staff BFF error reporting
