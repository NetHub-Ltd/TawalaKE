# Task Tracker

**Base / PR target:** `dev`  
**Branch:** `feat/paywall-service-class`

## Goal

Class-based paywall with Redis-accelerated reads; PostgreSQL remains source of truth for usage (`subscriptions.current_usage` + live counts).

## Completed

- [x] `PaywallService` class (resolve, cache, features, limits, persist/bump usage)
- [x] `api/paywall_deps.py` — require_paywall / require_active_plan / get_entitlements
- [x] `middleware/paywall.py` — validity gate (Redis-first)
- [x] Root feature combo (≥3) on products/stock/business routers
- [x] Usage bump persisted to DB after product/staff/store create
- [x] Cache invalidate on trial start
- [x] Tests updated for class API

## Source of truth

- Plans + subscription rows + `current_usage` JSONB → **Postgres**
- Entitlements + validity bit → **Redis cache only** (TTL ~60–90s)
