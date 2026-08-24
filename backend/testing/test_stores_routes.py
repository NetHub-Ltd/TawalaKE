"""Tests for store/business API endpoints."""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi import status
from uuid import uuid4


# ------------------------------------------------------------------
# 1. PATCH /api/v1/business/update-business/{business_id}
# ------------------------------------------------------------------
def test_update_business_success(client_as_owner):
    """Update business details."""
    with patch("app.api.routes.stores.store_crud.get_business_by_id", new_callable=AsyncMock) as mock_get, \
         patch("app.api.routes.stores.store_crud.update_business", new_callable=AsyncMock) as mock_update:
        mock_get.return_value = MagicMock(id=uuid4(), name="Old Store")
        mock_update.return_value = MagicMock(id=uuid4(), name="Updated Store")
        response = client_as_owner.patch(
            f"/api/v1/business/update-business/{uuid4()}",
            json={"name": "Updated Store"}
        )
        assert response.status_code == status.HTTP_200_OK


# ------------------------------------------------------------------
# 2. DELETE /api/v1/business/delete/{business_id}
# ------------------------------------------------------------------
def test_delete_business_success(client_as_owner):
    """Delete a business."""
    with patch("app.api.routes.stores.store_crud.get_business_by_id", new_callable=AsyncMock) as mock_get, \
         patch("app.api.routes.stores.store_crud.update_business", new_callable=AsyncMock) as mock_update:
        mock_get.return_value = MagicMock(id=uuid4())
        mock_update.return_value = MagicMock(id=uuid4(), active=False)
        response = client_as_owner.delete(f"/api/v1/business/delete/{uuid4()}")
        assert response.status_code == status.HTTP_200_OK


# ------------------------------------------------------------------
# 3. POST /api/v1/business/restock
# ------------------------------------------------------------------
def test_restock_product_success(client_as_owner):
    """Restock a product."""
    with patch("app.api.routes.stores.store_crud.add_new_stock", new_callable=AsyncMock) as mock_restock:
        mock_restock.return_value = MagicMock(id=uuid4(), label="Restocked Product")
        response = client_as_owner.post(
            "/api/v1/business/restock",
            json={"product_id": str(uuid4()), "quantity": 50.0, "cost_price": 100.0}
        )
        assert response.status_code == status.HTTP_200_OK


# ------------------------------------------------------------------
# 4. POST /api/v1/business/stock-audit
# ------------------------------------------------------------------
def test_audit_product_stock_success(client_as_owner):
    """Audit product stock levels."""
    with patch("app.api.routes.stores.store_crud.audit_stock", new_callable=AsyncMock) as mock_audit:
        mock_audit.return_value = MagicMock(id=uuid4(), stock=100.0)
        response = client_as_owner.post(
            "/api/v1/business/stock-audit",
            json={
                "product_id": str(uuid4()),
                "actual_physical_stock": 95.0,
                "reason_code": "MONTHLY_AUDIT",
                "notes": "Monthly audit"
            }
        )
        assert response.status_code == status.HTTP_200_OK


# ------------------------------------------------------------------
# 5. POST /api/v1/business/new-sale
# ------------------------------------------------------------------
def test_create_pending_sale_success(client_as_owner):
    """Create a pending sale."""
    with patch("app.api.routes.stores.store_crud.initialize_checkout", new_callable=AsyncMock) as mock_init:
        mock_init.return_value = MagicMock(id=uuid4(), status="PENDING_PAYMENT", total_amount=1160.0)
        response = client_as_owner.post(
            "/api/v1/business/new-sale",
            json={
                "business_id": str(uuid4()),
                "items": [{"product_id": str(uuid4()), "quantity": 2.0, "unit_price": 1000.0}]
            }
        )
        assert response.status_code == status.HTTP_200_OK


# ------------------------------------------------------------------
# 6. GET /api/v1/business/sales/{business_id}
# ------------------------------------------------------------------
def test_get_sales_success(client_as_owner):
    """List sales for a business."""
    with patch("app.api.routes.stores.store_crud.fetch_sales", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = [MagicMock(id=uuid4(), total_amount=500.0)]
        response = client_as_owner.get(f"/api/v1/business/sales/{uuid4()}")
        assert response.status_code == status.HTTP_200_OK


# ------------------------------------------------------------------
# 7. POST /api/v1/business/checkout
# ------------------------------------------------------------------
def test_checkout_sale_success(client_as_owner):
    """Finalize a sale checkout."""
    with patch("app.api.routes.stores.store_crud.finalize_checkout", new_callable=AsyncMock) as mock_finalize:
        mock_finalize.return_value = MagicMock(id=uuid4(), status="COMPLETED")
        response = client_as_owner.post(
            "/api/v1/business/checkout",
            json={"sale_id": str(uuid4()), "payment_method": "MPESA", "payment_reference": "TXN123"}
        )
        assert response.status_code == status.HTTP_200_OK


# ------------------------------------------------------------------
# 8. POST /api/v1/business/assign-staff
# ------------------------------------------------------------------
def test_register_and_assign_staff_success(client_as_owner):
    """Register and assign staff to a business."""
    with patch("app.api.routes.stores.store_crud.create_staff_account", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = MagicMock(id=uuid4(), email="staff@nethub.co.ke", full_name="New Staff")
        response = client_as_owner.post(
            "/api/v1/business/assign-staff",
            json={
                "tenant_id": str(uuid4()),
                "email": "staff@nethub.co.ke",
                "full_name": "New Staff",
                "business_id": str(uuid4())
            }
        )
        assert response.status_code == status.HTTP_200_OK


# ------------------------------------------------------------------
# 9. GET /api/v1/business/get-staff
# ------------------------------------------------------------------
def test_fetch_staff_with_id_success(client_as_owner):
    """Fetch staff by ID."""
    with patch("app.api.routes.stores.store_crud.fetch_staff_with_id", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = (MagicMock(id=uuid4(), full_name="Staff Member"), MagicMock())
        response = client_as_owner.get(f"/api/v1/business/get-staff?staff_id={uuid4()}")
        assert response.status_code == status.HTTP_200_OK


# ------------------------------------------------------------------
# 10. GET /api/v1/business/receipts/{sale_id}
# ------------------------------------------------------------------
def test_fetch_receipts_success(client_as_owner):
    """Fetch receipt for a sale."""
    with patch("app.api.routes.stores.store_crud.get_financial_document_json", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = {"document_number": "REC-001", "total_amount": 1160.0}
        response = client_as_owner.get(f"/api/v1/business/receipts/{uuid4()}")
        assert response.status_code == status.HTTP_200_OK


# ------------------------------------------------------------------
# 11. GET /api/v1/business/analytics
# ------------------------------------------------------------------
def test_get_dashboard_analytics_success(client_as_owner):
    """Fetch dashboard analytics."""
    with patch("app.api.routes.stores.store_crud.fetch_dashboard_analytics", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = {"total_sales": 50000.0, "transaction_count": 150}
        response = client_as_owner.get(f"/api/v1/business/analytics?business_id={uuid4()}")
        assert response.status_code == status.HTTP_200_OK
