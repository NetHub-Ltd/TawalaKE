"""Paywall hardening: no header middleware, lifecycle invalidate helpers exist."""
from pathlib import Path

from app.crud import subscription as subscription_crud


def test_middleware_module_has_no_http_class():
    src = Path("app/middleware/paywall.py").read_text()
    assert "BaseHTTPMiddleware" not in src
    assert "X-Organization-Id" not in src and "x-organization-id" not in src


def test_subscription_lifecycle_helpers_exported():
    assert callable(subscription_crud.deactivate_subscription)
    assert callable(subscription_crud.activate_or_extend_subscription)
    assert callable(subscription_crud.mark_expired_subscriptions)
    assert callable(subscription_crud._invalidate_org)


def test_main_does_not_register_paywall_middleware():
    main = Path("app/main.py").read_text()
    assert "PaywallValidityMiddleware" not in main
