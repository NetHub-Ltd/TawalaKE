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


def test_compute_exact_pay_no_change():
    c = compute_payment_amounts(amount_due=1000, amount_given=1000)
    assert c["amount"] == 1000
    assert c["change_due"] == 0
    assert c["is_full"] is True


def test_compute_overpay_change():
    c = compute_payment_amounts(amount_due=8370, amount_given=10000)
    assert c["amount"] == 8370
    assert c["change_due"] == 1630
    assert c["is_full"] is True


def test_compute_zero_given():
    c = compute_payment_amounts(amount_due=500, amount_given=0)
    assert c["amount"] == 0
    assert c["is_full"] is False


def test_compute_negative_inputs_clamped():
    c = compute_payment_amounts(amount_due=-10, amount_given=-5)
    assert c["amount_due_at_payment"] == 0
    assert c["amount"] == 0


def test_multi_step_remaining_sequence():
    """Unpaid → partial → partial → complete using remaining helper."""
    from app.core.payment_methods import (
        resolve_sale_status_after_payment,
        sale_remaining_balance,
    )
    total = 48_370.0
    paid = 0.0
    assert sale_remaining_balance(total_amount=total, payments_sum=paid) == 48_370.0

    step1 = compute_payment_amounts(amount_due=48_370.0, amount_given=20_000.0)
    paid += step1["amount"]
    assert resolve_sale_status_after_payment(
        amount_due_before=48_370.0, amount_applied=step1["amount"]
    ) == "PARTIALLY_PAID"
    rem = sale_remaining_balance(total_amount=total, payments_sum=paid)
    assert rem == 28_370.0

    step2 = compute_payment_amounts(amount_due=rem, amount_given=20_000.0)
    paid += step2["amount"]
    rem = sale_remaining_balance(total_amount=total, payments_sum=paid)
    assert rem == 8_370.0
    assert resolve_sale_status_after_payment(
        amount_due_before=28_370.0, amount_applied=step2["amount"]
    ) == "PARTIALLY_PAID"

    step3 = compute_payment_amounts(amount_due=rem, amount_given=8_370.0)
    paid += step3["amount"]
    rem = sale_remaining_balance(total_amount=total, payments_sum=paid)
    assert rem == 0.0
    assert resolve_sale_status_after_payment(
        amount_due_before=8_370.0, amount_applied=step3["amount"]
    ) == "COMPLETED"


def test_penny_rounding_remaining():
    """Floating pennies must not leave phantom 0.01 due."""
    from app.core.payment_methods import sale_remaining_balance
    total = 100.0
    paid = 99.995
    rem = sale_remaining_balance(total_amount=total, payments_sum=paid)
    assert rem == 0.0 or rem <= 0.01
