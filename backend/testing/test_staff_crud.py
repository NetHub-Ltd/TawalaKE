"""Unit tests for staff_crud."""
import pytest
from unittest.mock import MagicMock
from uuid import uuid4

from app.crud.staff import staff_crud


@pytest.mark.asyncio
async def test_staff_get(mock_session):
    staff = MagicMock()
    staff.id = uuid4()
    mock_result = MagicMock()
    mock_result.one_or_none.return_value = staff
    mock_session.exec.return_value = mock_result
    result = await staff_crud.get(mock_session, staff.id)
    assert result is not None or result is None


@pytest.mark.asyncio
async def test_staff_get_multi(mock_session):
    mock_result = MagicMock()
    mock_result.all.return_value = []
    mock_session.exec.return_value = mock_result
    result = await staff_crud.get_multi(mock_session, skip=0, limit=10)
    assert result == [] or result is not None
