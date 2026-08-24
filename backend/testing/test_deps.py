"""Tests for API dependencies (auth gate)."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi import HTTPException

from app.api.deps import get_current_user, get_current_staff
from app.models.models import StaffRole


@pytest.mark.asyncio
async def test_get_current_user_missing_credentials(mock_session, mock_redis):
    with pytest.raises(HTTPException) as ei:
        await get_current_user(db=mock_session, redis=mock_redis, credentials=None)
    assert ei.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_inactive(mock_session, mock_redis):
    from app.core.security import TokenData
    token_data = MagicMock()
    token_data.sub = str(uuid4())
    staff = MagicMock()
    staff.active = False
    staff.id = token_data.sub
    staff.assigned_businesses = [MagicMock()]
    mock_result = MagicMock()
    mock_result.first.return_value = staff
    mock_session.exec.return_value = mock_result

    with patch("app.api.deps.security.verify_token", new_callable=AsyncMock) as vt:
        vt.return_value = token_data
        with pytest.raises(HTTPException) as ei:
            await get_current_user(db=mock_session, redis=mock_redis, credentials="token")
        assert ei.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_staff_rejects_unknown_role(mock_staff_user):
    mock_staff_user.role = MagicMock()
    mock_staff_user.role.value = "SUPER_ADMIN"
    # string role path
    mock_staff_user.role = "SUPER_ADMIN"
    with pytest.raises(HTTPException) as ei:
        await get_current_staff(current_user=mock_staff_user)
    assert ei.value.status_code == 403


@pytest.mark.asyncio
async def test_get_current_staff_allows_owner(mock_staff_user):
    result = await get_current_staff(current_user=mock_staff_user)
    assert result is mock_staff_user
