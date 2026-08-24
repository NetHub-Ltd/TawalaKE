"""Tests for payment API endpoints."""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi import status
from uuid import uuid4


# ------------------------------------------------------------------
# 1. POST /api/v1/payments/stk-push
# ------------------------------------------------------------------
def test_stk_push_success(client_as_owner):
    """Initiate M-Pesa STK push."""
    with patch("app.api.routes.payments.stk_push", new_callable=AsyncMock) as mock_push:
        mock_push.return_value = {"checkout_request_id": "ws_CO_123", "response_code": "0"}
        response = client_as_owner.post(
            "/api/v1/payments/stk-push",
            json={"phone_number": "254712345678", "amount": 1000.0, "account_reference": "INV001"}
        )
        assert response.status_code == status.HTTP_200_OK


# ------------------------------------------------------------------
# 2. POST /api/v1/payments/confirmation
# ------------------------------------------------------------------
def test_confirmation_callback(client_unauthenticated):
    """M-Pesa confirmation callback."""
    response = client_unauthenticated.post(
        "/api/v1/payments/confirmation",
        json={"transaction_type": "Pay Bill", "trans_id": "TXN123", "trans_amount": "1000.00"}
    )
    assert response.status_code == status.HTTP_200_OK


# ------------------------------------------------------------------
# 3. POST /api/v1/payments/validation
# ------------------------------------------------------------------
def test_validation_callback(client_unauthenticated):
    """M-Pesa validation callback."""
    response = client_unauthenticated.post(
        "/api/v1/payments/validation",
        json={"transaction_type": "Pay Bill", "trans_id": "TXN123", "trans_amount": "1000.00"}
    )
    assert response.status_code == status.HTTP_200_OK
