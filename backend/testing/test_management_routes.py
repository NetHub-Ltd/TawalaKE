"""Tests for management (admin-only) API endpoints."""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi import status
from uuid import uuid4


# ------------------------------------------------------------------
# 1. GET /api/v1/management/test-email
# ------------------------------------------------------------------
def test_send_test_email_success(client_as_admin):
    """Admin can send a test email."""
    with patch("app.api.routes.management.mailer.send_test_email", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = {"message": "Email sent"}
        response = client_as_admin.get("/api/v1/management/test-email?email=admin@nethub.co.ke")
        assert response.status_code == status.HTTP_200_OK


def test_send_test_email_unauthorized(client_unauthenticated):
    """Unauthenticated request is rejected."""
    response = client_unauthenticated.get("/api/v1/management/test-email?email=test@nethub.co.ke")
    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


# ------------------------------------------------------------------
# 2. GET /api/v1/management/sales
# ------------------------------------------------------------------
def test_fetch_sales_admin_success(client_as_admin):
    """Admin can fetch all sales."""
    with patch("app.api.routes.management.store_crud.fetch_sales", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = [MagicMock(id=uuid4(), total_amount=1000.0)]
        response = client_as_admin.get("/api/v1/management/sales")
        assert response.status_code == status.HTTP_200_OK
