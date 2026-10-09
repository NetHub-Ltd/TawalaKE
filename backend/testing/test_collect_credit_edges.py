"""collect_credit_sale edge cases — status, remaining, payment method rules."""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import BackgroundTasks, HTTPException

from app.crud.store import store_crud
from app.models.models import PaymentMethod, SaleStatus
from app.schemas.store import FinalizeCheckoutIn


def _sale(
    *,
    status=SaleStatus.PENDING_PAYMENT,
    total=48_370.0,
    payments=None,
):
    return SimpleNamespace(
        id=uuid4(),
        business_id=uuid4(),
        organization_id=uuid4(),
        status=status,
        total_amount=total,
        payments=payments or [],
        items=[],
        customer_id=None,
        currency="KES",
    )


def _payload(*, method=PaymentMethod.CASH, amount_given=None, reference=None):
    return FinalizeCheckoutIn(
        sale_id=uuid4(),
        payment_method=method,
        amount_given=amount_given,
        payment_reference=reference,
    )


@pytest.mark.asyncio
async def test_collect_not_found():
    mock_session = AsyncMock()
    res = MagicMock()
    res.one_or_none.return_value = None
    mock_session.exec = AsyncMock(return_value=res)
    with pytest.raises(HTTPException) as ei:
        await store_crud.collect_credit_sale(
            mock_session,
            sale_id=uuid4(),
            payload=_payload(amount_given=100),
            background_tasks=BackgroundTasks(),
        )
    assert ei.value.status_code == 404


@pytest.mark.asyncio
async def test_collect_already_completed():
    mock_session = AsyncMock()
    res = MagicMock()
    res.one_or_none.return_value = _sale(status=SaleStatus.COMPLETED, payments=[
        SimpleNamespace(amount=100.0)
    ])
    mock_session.exec = AsyncMock(return_value=res)
    with pytest.raises(HTTPException) as ei:
        await store_crud.collect_credit_sale(
            mock_session,
            sale_id=uuid4(),
            payload=_payload(amount_given=50),
            background_tasks=BackgroundTasks(),
        )
    assert ei.value.status_code == 409


@pytest.mark.asyncio
async def test_collect_rejects_invoice_method():
    mock_session = AsyncMock()
    res = MagicMock()
    res.one_or_none.return_value = _sale(status=SaleStatus.PENDING_PAYMENT)
    mock_session.exec = AsyncMock(return_value=res)
    with pytest.raises(HTTPException) as ei:
        await store_crud.collect_credit_sale(
            mock_session,
            sale_id=uuid4(),
            payload=_payload(method=PaymentMethod.INVOICE, amount_given=100),
            background_tasks=BackgroundTasks(),
        )
    assert ei.value.status_code == 400
    assert "invoice" in str(ei.value.detail).lower()


@pytest.mark.asyncio
async def test_collect_mpesa_requires_reference():
    mock_session = AsyncMock()
    res = MagicMock()
    res.one_or_none.return_value = _sale(status=SaleStatus.PENDING_PAYMENT)
    mock_session.exec = AsyncMock(return_value=res)
    with pytest.raises(HTTPException) as ei:
        await store_crud.collect_credit_sale(
            mock_session,
            sale_id=uuid4(),
            payload=_payload(method=PaymentMethod.MPESA, amount_given=100, reference=""),
            background_tasks=BackgroundTasks(),
        )
    assert ei.value.status_code == 400
    assert "m-pesa" in str(ei.value.detail).lower() or "mpesa" in str(ei.value.detail).lower()


@pytest.mark.asyncio
async def test_collect_zero_amount_given_rejected():
    mock_session = AsyncMock()
    res = MagicMock()
    res.one_or_none.return_value = _sale(status=SaleStatus.PENDING_PAYMENT)
    mock_session.exec = AsyncMock(return_value=res)
    with pytest.raises(HTTPException) as ei:
        await store_crud.collect_credit_sale(
            mock_session,
            sale_id=uuid4(),
            payload=_payload(amount_given=0),
            background_tasks=BackgroundTasks(),
        )
    assert ei.value.status_code == 400


@pytest.mark.asyncio
async def test_collect_already_fully_paid_via_payments():
    """Status still PENDING but payments already cover total → conflict."""
    mock_session = AsyncMock()
    res = MagicMock()
    res.one_or_none.return_value = _sale(
        status=SaleStatus.PENDING_PAYMENT,
        total=1000.0,
        payments=[SimpleNamespace(amount=1000.0)],
    )
    mock_session.exec = AsyncMock(return_value=res)
    mock_session.add = MagicMock()
    mock_session.commit = AsyncMock()
    with pytest.raises(HTTPException) as ei:
        await store_crud.collect_credit_sale(
            mock_session,
            sale_id=uuid4(),
            payload=_payload(amount_given=100),
            background_tasks=BackgroundTasks(),
        )
    assert ei.value.status_code == 409


@pytest.mark.asyncio
async def test_collect_partial_sets_partially_paid():
    mock_session = AsyncMock()
    sale = _sale(status=SaleStatus.PENDING_PAYMENT, total=48_370.0, payments=[])
    res1 = MagicMock()
    res1.one_or_none.return_value = sale
    res2 = MagicMock()
    res2.first.return_value = sale
    mock_session.exec = AsyncMock(side_effect=[res1, res2])
    mock_session.add = MagicMock()
    mock_session.commit = AsyncMock()

    bg = BackgroundTasks()
    with patch("app.crud.store.schedule_document_generation") as sched, \
         patch(
             "app.services.analytics_outbox.enqueue_analytics_outbox",
             new_callable=AsyncMock,
         ), \
         patch("app.crud.store.async_update_sales_analytics", create=True):
        out = await store_crud.collect_credit_sale(
            mock_session,
            sale_id=sale.id,
            payload=_payload(amount_given=40_000.0),
            background_tasks=bg,
        )

    assert sale.status == SaleStatus.PARTIALLY_PAID
    assert out is sale
    # Payment row was staged
    assert mock_session.add.call_count >= 1
    sched.assert_called()
    mock_session.commit.assert_awaited()


@pytest.mark.asyncio
async def test_collect_full_remaining_completes():
    mock_session = AsyncMock()
    prior = SimpleNamespace(amount=40_000.0)
    sale = _sale(
        status=SaleStatus.PARTIALLY_PAID,
        total=48_370.0,
        payments=[prior],
    )
    res1 = MagicMock()
    res1.one_or_none.return_value = sale
    res2 = MagicMock()
    res2.first.return_value = sale
    mock_session.exec = AsyncMock(side_effect=[res1, res2])
    mock_session.add = MagicMock()
    mock_session.commit = AsyncMock()

    bg = BackgroundTasks()
    with patch("app.crud.store.schedule_document_generation"), \
         patch(
             "app.services.analytics_outbox.enqueue_analytics_outbox",
             new_callable=AsyncMock,
         ), \
         patch("app.crud.store.async_update_sales_analytics", create=True):
        await store_crud.collect_credit_sale(
            mock_session,
            sale_id=sale.id,
            payload=_payload(amount_given=8_370.0),
            background_tasks=bg,
        )

    assert sale.status == SaleStatus.COMPLETED
