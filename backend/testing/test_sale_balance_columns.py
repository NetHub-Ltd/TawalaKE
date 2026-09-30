"""Denormalized sale amount_paid / balance_due helpers."""
from types import SimpleNamespace

from app.core.payment_methods import sync_sale_payment_columns


def test_sync_unpaid_credit():
    sale = SimpleNamespace(total_amount=24_000.0, status="PENDING_PAYMENT", amount_paid=0, balance_due=0)
    sync_sale_payment_columns(sale, [])
    assert sale.amount_paid == 0.0
    assert sale.balance_due == 24_000.0


def test_sync_partial():
    sale = SimpleNamespace(total_amount=24_000.0, status="PARTIALLY_PAID", amount_paid=0, balance_due=0)
    payments = [SimpleNamespace(amount=23_000.0)]
    sync_sale_payment_columns(sale, payments)
    assert sale.amount_paid == 23_000.0
    assert sale.balance_due == 1_000.0


def test_sync_completed_forces_zero_due():
    sale = SimpleNamespace(total_amount=100.0, status="COMPLETED", amount_paid=0, balance_due=99)
    payments = [SimpleNamespace(amount=100.0)]
    sync_sale_payment_columns(sale, payments)
    assert sale.amount_paid == 100.0
    assert sale.balance_due == 0.0


def test_sync_multi_payment():
    sale = SimpleNamespace(total_amount=48_370.0, status="PARTIALLY_PAID", amount_paid=0, balance_due=0)
    payments = [SimpleNamespace(amount=20_000.0), {"amount": 20_000.0}]
    sync_sale_payment_columns(sale, payments)
    assert sale.amount_paid == 40_000.0
    assert sale.balance_due == 8_370.0
