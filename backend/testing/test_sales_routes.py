"""Tests for sales API endpoints."""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi import status
from uuid import uuid4


# ------------------------------------------------------------------
# 1. POST /api/v1/sales/new-sale
# ------------------------------------------------------------------
def test_create_sale_success(client_as_owner):
    """Create a new sale."""
    with patch("app.api.routes.sales.store_crud.initialize_checkout", new_callable=AsyncMock) as mock_init:
        mock_init.return_value = MagicMock(id=uuid4(), status="PENDING_PAYMENT", total_amount=2320.0)
        response = client_as_owner.post(
            "/api/v1/sales/new-sale",
            json={
                "business_id": str(uuid4()),
                "cashier_id": str(uuid4()),
                "items": [{"product_id": str(uuid4()), "quantity": 2.0, "unit_price": 1000.0}]
            }
        )
        assert response.status_code == status.HTTP_200_OK


def test_create_sale_product_not_found(client_as_owner):
    """Sale with invalid product returns 404."""
    with patch("app.api.routes.sales.store_crud.initialize_checkout", new_callable=AsyncMock) as mock_init:
        from fastapi import HTTPException
        mock_init.side_effect = HTTPException(status_code=404, detail="Product not found")
        response = client_as_owner.post(
            "/api/v1/sales/new-sale",
            json={
                "business_id": str(uuid4()),
                "cashier_id": str(uuid4()),
                "items": [{"product_id": str(uuid4()), "quantity": 1.0}]
            }
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
