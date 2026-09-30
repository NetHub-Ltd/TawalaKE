"""Document financial snapshot rules — goods vs discount, paid vs due."""
from __future__ import annotations


def _compute_financials(
    *,
    subtotal_net: float,
    discount: float,
    tax: float,
    service_total: float,
    total_amount: float,
    total_paid: float,
) -> dict:
    """Mirrors worker snapshot composition used for invoice accuracy."""
    goods_sub = round(subtotal_net + discount, 2)
    balance_due = round(max(0.0, float(total_amount) - float(total_paid)), 2)
    return {
        "goods_subtotal": goods_sub,
        "subtotal": round(subtotal_net, 2),
        "discount_amount": round(discount, 2),
        "tax_amount": round(tax, 2),
        "service_total": round(service_total, 2),
        "total_amount": round(total_amount, 2),
        "amount_paid": round(total_paid, 2),
        "balance_due": balance_due,
    }


def test_goods_subtotal_recovers_pre_discount():
    """Stored subtotal is post-discount; goods = net + discount for invoice display."""
    fin = _compute_financials(
        subtotal_net=900.0,
        discount=100.0,
        tax=0.0,
        service_total=0.0,
        total_amount=900.0,
        total_paid=0.0,
    )
    assert fin["goods_subtotal"] == 1000.0
    assert fin["subtotal"] == 900.0
    assert fin["discount_amount"] == 100.0
    # Printing goods then discount then total must not imply total = goods - 2*discount
    assert fin["total_amount"] == fin["subtotal"] + fin["tax_amount"] + fin["service_total"]


def test_partial_pay_balance_on_snapshot():
    fin = _compute_financials(
        subtotal_net=48_000.0,
        discount=0.0,
        tax=0.0,
        service_total=370.0,
        total_amount=48_370.0,
        total_paid=40_000.0,
    )
    assert fin["balance_due"] == 8_370.0
    assert fin["amount_paid"] == 40_000.0


def test_fully_paid_balance_zero():
    fin = _compute_financials(
        subtotal_net=1000.0,
        discount=0.0,
        tax=0.0,
        service_total=0.0,
        total_amount=1000.0,
        total_paid=1000.0,
    )
    assert fin["balance_due"] == 0.0


def test_overpay_balance_not_negative():
    fin = _compute_financials(
        subtotal_net=100.0,
        discount=0.0,
        tax=0.0,
        service_total=0.0,
        total_amount=100.0,
        total_paid=150.0,
    )
    assert fin["balance_due"] == 0.0
