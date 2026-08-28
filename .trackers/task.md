# Task

**Branch:** `fix/frontend-sidebar-rbac-import-and-ci` → `dev`

## Goal
Fix Sidebar `Permission is not defined` runtime crash; add frontend CI (lint strict + build).

## Done
- [x] Rewrite Sidebar: single `"use client"` at top + `@/lib/rbac` imports
- [x] `.github/workflows/test_frontend.yml` on push/PR to main and dev
