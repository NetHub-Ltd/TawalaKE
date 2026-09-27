from app.core.payment_methods import (
    compute_payment_amounts,
    enabled_pos_methods,
    resolve_payment_methods,
)


def test_defaults_enable_cash_mpesa_credit():
    methods = resolve_payment_methods(None, None)
    by = {m["code"]: m for m in methods}
    assert by["CASH"]["enabled"] is True
    assert by["MPESA"]["enabled"] is True
    assert by["CREDIT"]["enabled"] is True
    assert by["CARD"]["enabled"] is False
    assert by["STK_PUSH"]["enabled"] is False


def test_org_disable_blocks_business_enable():
    org = {"payment_methods": {"MPESA": {"enabled": False}}}
    biz = {"payment_methods": {"MPESA": {"enabled": True}}}
    by = {m["code"]: m for m in resolve_payment_methods(org, biz)}
    assert by["MPESA"]["enabled"] is False


def test_business_can_disable_when_org_on():
    org = {"payment_methods": {"CASH": {"enabled": True}}}
    biz = {"payment_methods": {"CASH": {"enabled": False}}}
    by = {m["code"]: m for m in resolve_payment_methods(org, biz)}
    assert by["CASH"]["enabled"] is False


def test_enabled_pos_codes_use_api_method():
    codes = [m["api_method"] for m in enabled_pos_methods(None, None)]
    assert "CASH" in codes
    assert "MPESA" in codes
    assert "INVOICE" in codes
    assert "CARD" not in codes


def test_compute_full_with_change():
    c = compute_payment_amounts(amount_due=1000, amount_given=1050)
    assert c["amount"] == 1000
    assert c["amount_given"] == 1050
    assert c["change_due"] == 50
    assert c["is_full"] is True


def test_compute_partial():
    c = compute_payment_amounts(amount_due=1000, amount_given=400)
    assert c["amount"] == 400
    assert c["amount_given"] == 400
    assert c["change_due"] == 0
    assert c["is_full"] is False
