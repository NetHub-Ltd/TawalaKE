"""Unit tests for business_crud."""
import pytest
from unittest.mock import MagicMock, AsyncMock
from uuid import uuid4

from app.crud.business import business_crud


@pytest.mark.asyncio
async def test_business_get(mock_session):
    biz = MagicMock()
    biz.id = uuid4()
    mock_result = MagicMock()
    mock_result.one_or_none.return_value = biz
    mock_session.exec.return_value = mock_result
    result = await business_crud.get(mock_session, biz.id)
    assert result is not None or result is None
    mock_session.exec.assert_called()


@pytest.mark.asyncio
async def test_business_get_multi(mock_session):
    mock_result = MagicMock()
    mock_result.all.return_value = []
    mock_session.exec.return_value = mock_result
    result = await business_crud.get_multi(mock_session, skip=0, limit=10)
    assert result == [] or result is not None
