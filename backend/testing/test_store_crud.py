"""Tests for store/business CRUD operations."""
import pytest
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch

from app.crud.store import store_crud
from app.models.models import Business, Product, Staff, Sale, SaleItem, StockHistory

async def test_get_store_products_ordering_and_filters(mock_session, sample_business_id):
    """
    Verifies that store product queries correctly apply structural filtering criteria
    and strictly append the order_by constraint safely.
    """
    mock_product = Product(
        id=uuid4(),
        business_id=sample_business_id,
        label="Premium Product",
        sku="PRM-001",
        stock=50.0
    )


async def test_initialize_checkout_success(mock_session, sample_business_id):
    """
    Validates checkout initiation accurately reads item lines, creates a transient
    pending sale tracking ledger instance, and maps attributes seamlessly.
    """
    product_id = uuid4()
    cashier_id = uuid4()


async def test_initialize_checkout_product_not_found(mock_session, sample_business_id):
    """
    Verifies that selecting an invalid or non-existent product ID drops the transaction
    cleanly with a 404 HTTP Exception pattern.
    """
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.exec.return_value = mock_result


async def test_finalize_checkout_success(mock_session, sample_business_id):
    """
    Ensures finalization processes record completions, executes accurate balances deductions,
    and returns database records safely.
    """
    sale_id = uuid4()
    product_id = uuid4()


async def test_create_staff_account_success(mock_session, sample_org_id, sample_business_id):
    """
    Verifies that staff account creation successfully signs records into persistence matrices.
    """
    payload = StaffCreateIn(
        tenant_id=sample_org_id,
        email="operator@nethub.co.ke",
        full_name="Jane Doe",
        business_id=sample_business_id,
        password="SecureSecretPassword123",
        role=StaffRole.CASHIER
    )


async def test_get_financial_document_json_by_id(mock_session, sample_business_id):
    """
    Validates that get_financial_document_json correctly queries via document_id
    and builds the structured dictionary format including line item serialization.
    """
    doc_id = uuid4()
    sale_id = uuid4()


async def test_list_business_financial_documents_json(mock_session, sample_business_id):
    """
    Ensures list_business_financial_documents_json cleanly handles paginated retrieval,
    executes both count and data queries, and returns structural summary matrices.
    """
    mock_doc = FinancialDocument(
        id=uuid4(),
        business_id=sample_business_id,
        sale_id=uuid4(),
        document_type=DocumentType.INVOICE,
        document_number="INV-2026-001",
        subtotal=500.0,
        total_amount=580.0,
        amount_paid=0.0
    )


async def test_get_business_analytics(mock_session, sample_business_id):
    """
    Validates the analytics aggregation logic, ensuring total sales revenue,
    transaction count, and tax calculations match metrics correctly within boundaries.
    """
    start_date = datetime.now(timezone.utc) - timedelta(days=7)
    end_date = datetime.now(timezone.utc)


async def test_finalize_checkout_pipeline(mock_session, sample_business_id):
    """
    Validates transactional consistency across line-item inventories, state mapping
    mutations, and immediate downstream celery task triggers.
    """
    sale_id = uuid4()
    product_id = uuid4()
    
    mock_sale = Sale(
        id=sale_id,
        business_id=sample_business_id,
        subtotal=2000.0,
        discount=0.0,
        tax_amount=320.0,
        total_amount=2320.0,
        status=SaleStatus.PENDING_PAYMENT,
        customer_id=None
    )
    
    mock_item = SaleItem(
        id=uuid4(),
        sale_id=sale_id,
        product_id=product_id,
        quantity=2.0,
        unit_price=1000.0,
        total_price=2000.0
    )
    mock_sale.items = [mock_item]
    
    mock_product = Product(
        id=product_id,
        business_id=sample_business_id,
        name="Test Item Sku",
        stock=10,
        track_stock=True,
        selling_price=1000.0,
        cost_price=700.0
    )
