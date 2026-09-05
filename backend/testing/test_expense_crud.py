"""Expense tracker unit tests."""
from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.crud.expense import expense_crud
from app.models.models import ExpenseCategory
from app.schemas.expense import ExpenseCreate


@pytest.mark.asyncio
async def test_create_expense(mock_session):
    mock_session.commit = AsyncMock()
    mock_session.refresh = AsyncMock()
    mock_session.add = MagicMock()
    payload = ExpenseCreate(
        business_id=uuid4(),
        category=ExpenseCategory.RENT,
        amount=15000,
        incurred_on=datetime.now(timezone.utc),
        notes="Shop rent",
    )
    # refresh leaves obj as-is
    obj = await expense_crud.create_expense(
        mock_session,
        payload=payload,
        organization_id=uuid4(),
        recorded_by=uuid4(),
    )
    assert obj.amount == 15000
    assert obj.category == ExpenseCategory.RENT
    mock_session.add.assert_called()
    mock_session.commit.assert_awaited()


@pytest.mark.asyncio
async def test_period_summary_empty(mock_session):
    sum_result = MagicMock()
    sum_result.one.return_value = (0.0, 0)
    cat_result = MagicMock()
    cat_result.all.return_value = []
    mock_session.exec = AsyncMock(side_effect=[sum_result, cat_result])
    out = await expense_crud.period_summary(
        mock_session,
        business_id=uuid4(),
        start=datetime(2026, 9, 1, tzinfo=timezone.utc),
        end=datetime(2026, 9, 8, tzinfo=timezone.utc),
    )
    assert out.total_amount == 0.0
    assert out.count == 0
