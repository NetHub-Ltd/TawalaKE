"""Route tests — routes currently commented out of api_router."""
import pytest
pytestmark = pytest.mark.skip(reason="Route not mounted in api_router (sales/payments/staff disabled)")

"""Tests for staff API endpoints."""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi import status
from uuid import uuid4


# ------------------------------------------------------------------
# 1. POST /api/v1/staff/register
# ------------------------------------------------------------------
def test_create_staff_member_success(client_as_owner):
    """Register a new staff member."""
    with patch("app.api.routes.staff.staff_crud.onboard_staff", new_callable=AsyncMock) as mock_onboard:
        mock_onboard.return_value = MagicMock(id=uuid4(), email="newstaff@nethub.co.ke", full_name="New Staff")
        response = client_as_owner.post(
            "/api/v1/staff/register",
            json={
                "organization_id": str(uuid4()),
                "email": "newstaff@nethub.co.ke",
                "full_name": "New Staff",
                "business_id": str(uuid4()),
                "password": "SecurePass123!",
                "role": "CASHIER"
            }
        )
        assert response.status_code == status.HTTP_201_CREATED


def test_create_staff_member_duplicate_email(client_as_owner):
    """Duplicate email returns 409."""
    with patch("app.api.routes.staff.staff_crud.onboard_staff", new_callable=AsyncMock) as mock_onboard:
        from sqlalchemy.exc import IntegrityError
        mock_onboard.side_effect = IntegrityError("stmt", "params", Exception("duplicate"))
        response = client_as_owner.post(
            "/api/v1/staff/register",
            json={
                "organization_id": str(uuid4()),
                "email": "dup@nethub.co.ke",
                "full_name": "Dup Staff",
                "business_id": str(uuid4()),
                "role": "CASHIER"
            }
        )
        assert response.status_code == status.HTTP_409_CONFLICT
