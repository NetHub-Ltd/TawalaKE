"""Paywall validity middleware — DISABLED.

Plan validity is enforced only via authenticated dependencies:
  - require_active_plan
  - require_paywall(...)
  - PaywallService on create paths

Previously this module registered an HTTP middleware that trusted a client
tenant header. That is not a safe tenant signal. The middleware was removed
from the app stack in the paywall-hardening pass. This module remains so
old imports do not break.
"""
from __future__ import annotations

# Intentionally empty of HTTP middleware. Do not re-register without
# deriving organization_id solely from verified JWT/session state.
