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


def test_resolve_status_full():
    from app.core.payment_methods import resolve_sale_status_after_payment

    assert (
        resolve_sale_status_after_payment(amount_due_before=1000, amount_applied=1000)
        == "COMPLETED"
    )
    assert (
        resolve_sale_status_after_payment(amount_due_before=1000, amount_applied=1000.0004)
        == "COMPLETED"
    )


def test_resolve_status_partial():
    from app.core.payment_methods import resolve_sale_status_after_payment

    assert (
        resolve_sale_status_after_payment(amount_due_before=1000, amount_applied=400)
        == "PARTIALLY_PAID"
    )


def test_resolve_status_zero_applied():
    from app.core.payment_methods import resolve_sale_status_after_payment

    assert (
        resolve_sale_status_after_payment(amount_due_before=1000, amount_applied=0)
        == "PENDING_PAYMENT"
    )


def test_sale_remaining_balance():
    from app.core.payment_methods import sale_remaining_balance

    assert sale_remaining_balance(total_amount=1000, payments_sum=250) == 750.0
    assert sale_remaining_balance(total_amount=1000, payments_sum=1000) == 0.0
