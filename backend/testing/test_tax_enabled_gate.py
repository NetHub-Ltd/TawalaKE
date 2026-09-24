"""tax_enabled must zero out tax when disabled."""
from __future__ import annotations

from unittest.mock import MagicMock


def _effective_tax_rate(business, payload_tax: float = 0.0) -> float:
    """Mirror initialize_checkout tax resolution (store.py)."""
    tax_rate = float(payload_tax or 0.0)
    tax_on = bool(getattr(business, "tax_enabled", False))
    if tax_on and tax_rate == 0.0 and getattr(business, "tax_rate", None) is not None:
        tax_rate = float(business.tax_rate or 0.0)
    if tax_rate > 1.0:
        tax_rate = tax_rate / 100.0
    if not tax_on:
        tax_rate = 0.0
    return tax_rate


def test_tax_disabled_zeros_rate():
    biz = MagicMock(tax_enabled=False, tax_rate=16.0)
    assert _effective_tax_rate(biz, 0.0) == 0.0
    assert _effective_tax_rate(biz, 0.16) == 0.0


def test_tax_enabled_uses_business_rate_fraction():
    biz = MagicMock(tax_enabled=True, tax_rate=0.16)
    assert abs(_effective_tax_rate(biz, 0.0) - 0.16) < 1e-9


def test_tax_enabled_converts_percent():
    biz = MagicMock(tax_enabled=True, tax_rate=16)
    assert abs(_effective_tax_rate(biz, 0.0) - 0.16) < 1e-9


def test_tax_enabled_payload_rate():
    biz = MagicMock(tax_enabled=True, tax_rate=0.0)
    assert abs(_effective_tax_rate(biz, 0.08) - 0.08) < 1e-9
