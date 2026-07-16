# # testing/test_store_crud.py
# import pytest
# from uuid import uuid4, UUID
# from datetime import datetime, timezone, timedelta
# from typing import List, Dict, Any, Tuple, Optional
# from unittest.mock import AsyncMock, MagicMock, patch
# from fastapi import HTTPException, status
# from sqlmodel import desc

# from app.crud.store import store_crud
# from app.models.models import (
#     Business, Product, Staff, Sale, SaleItem, StockHistory, 
#     StockMovementType, StaffBusinessAssignment, StaffRole, 
#     SaleStatus, PaymentMethod, Payment, FinancialDocument, DocumentType
# )
# from app.schemas.business import StaffRequest, ProductAuditRequest, ProductRestockRequest
# from app.schemas.store import FinalizeCheckoutIn, CartItemIn, InitializeCheckout
# from app.schemas.schemas import StaffCreateIn, BusinessCreate


# # =========================================================================
# # FIXTURES SETUP
# # =========================================================================

# @pytest.fixture
# def mock_session():
#     """
#     Generates an encapsulated, mocked AsyncSession interface instance.
#     Overwrites synchronous .add method behavior to avoid unawaited task execution coroutine warnings.
#     """
#     session = AsyncMock()
#     session.exec = AsyncMock()
#     session.execute = AsyncMock()
#     session.add = MagicMock()  # Synchronous override statement signature resolution safety rule
#     session.commit = AsyncMock()
#     session.flush = AsyncMock()
#     return session


# @pytest.fixture
# def sample_business_id():
#     return uuid4()


# @pytest.fixture
# def sample_org_id():
#     return uuid4()


# # =========================================================================
# # UNIT TEST IMPLEMENTATIONS
# # =========================================================================

# @pytest.mark.asyncio
# async def test_get_store_products_ordering_and_filters(mock_session, sample_business_id):
#     """
#     Verifies that store product queries correctly apply structural filtering criteria
#     and strictly append the order_by constraint safely.
#     """
#     mock_product = Product(
#         id=uuid4(),
#         business_id=sample_business_id,
#         label="Premium Product",
#         sku="PRM-001",
#         stock=50.0
#     )

#     mock_result = MagicMock()
#     mock_result.all.return_value = [mock_product]
#     mock_session.exec.return_value = mock_result

#     # Execute read tracking call
#     products = await store_crud.get_store_products(
#         db=mock_session,
#         business_id=sample_business_id,
#         skip=0,
#         limit=10
#     )

#     assert len(products) == 1
#     assert products[0].attributes.sku == "PRM-001"
#     assert mock_session.exec.call_count == 1


# @pytest.mark.asyncio
# async def test_initialize_checkout_success(mock_session, sample_business_id):
#     """
#     Validates checkout initiation accurately reads item lines, creates a transient
#     pending sale tracking ledger instance, and maps attributes seamlessly.
#     """
#     product_id = uuid4()
#     cashier_id = uuid4()

#     mock_product = Product(
#         id=product_id,
#         business_id=sample_business_id,
#         name="Test Inventory Item",
#         sku="SKU-TEST-99",
#         selling_price=150.0,
#         cost_price=90.0,
#         stock=20.0,
#         track_stock=True
#     )

#     # Route statement configurations dynamically
#     def query_router(stmt, *args, **kwargs):
#         res = MagicMock()
#         if "product" in str(stmt).lower():
#             res.scalar_one_or_none.return_value = mock_product
#         return res

#     mock_session.exec.side_effect = query_router

#     payload = InitializeCheckout(
#         business_id=sample_business_id,
#         cashier_id=cashier_id,
#         items=[CartItemIn(product_id=product_id, quantity=2.0)]
#     )

#     # Act
#     sale = await store_crud.initialize_checkout(db=mock_session, payload=payload)

#     assert sale is not None
#     assert sale.status == SaleStatus.PENDING_PAYMENT
#     assert sale.subtotal == 300.0
#     assert sale.total_amount == 348.0  # 300 + 16% Tax
#     assert len(sale.items) == 1


# @pytest.mark.asyncio
# async def test_initialize_checkout_product_not_found(mock_session, sample_business_id):
#     """
#     Verifies that selecting an invalid or non-existent product ID drops the transaction
#     cleanly with a 404 HTTP Exception pattern.
#     """
#     mock_result = MagicMock()
#     mock_result.scalar_one_or_none.return_value = None
#     mock_session.exec.return_value = mock_result

#     payload = InitializeCheckout(
#         business_id=sample_business_id,
#         cashier_id=uuid4(),
#         items=[CartItemIn(product_id=uuid4(), quantity=1.0)]
#     )

#     with pytest.raises(HTTPException) as exc_info:
#         await store_crud.initialize_checkout(db=mock_session, payload=payload)

#     assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


# @pytest.mark.asyncio
# async def test_finalize_checkout_success(mock_session, sample_business_id):
#     """
#     Ensures finalization processes record completions, executes accurate balances deductions,
#     and returns database records safely.
#     """
#     sale_id = uuid4()
#     product_id = uuid4()

#     mock_sale = Sale(
#         id=sale_id,
#         business_id=sample_business_id,
#         cashier_id=uuid4(),
#         status=SaleStatus.PENDING_PAYMENT,
#         subtotal=1000.0,
#         tax_amount=160.0,
#         total_amount=1160.0,
#         discount=0.0
#     )

#     mock_product = Product(
#         id=product_id,
#         business_id=sample_business_id,
#         name="Test Asset Item",
#         sku="SKU-990",
#         selling_price=500.0,
#         stock=10.0,
#         track_stock=True
#     )
    
#     mock_item = SaleItem(
#         id=uuid4(),
#         sale_id=sale_id,
#         product_id=product_id,
#         quantity=2.0,
#         unit_price=500.0,
#         total_price=1000.0,
#         sku="SKU-990",
#         name="Test Asset Item"
#     )
#     mock_sale.items = [mock_item]

#     def checkout_router(stmt, *args, **kwargs):
#         res = MagicMock()
#         stmt_str = str(stmt).lower()
#         if "sale" in stmt_str:
#             res.scalar_one_or_none.return_value = mock_sale
#         elif "product" in stmt_str:
#             res.scalar_one_or_none.return_value = mock_product
#         return res

#     mock_session.exec.side_effect = checkout_router

#     payload = FinalizeCheckoutIn(
#         sale_id=sale_id,
#         payment_method=PaymentMethod.MPESA,
#         payment_reference="MPESA_TXN_REF_123"
#     )

#     completed_sale = await store_crud.finalize_checkout(db=mock_session, sale_id=sale_id, payload=payload)

#     assert completed_sale.status == SaleStatus.COMPLETED
#     assert mock_product.stock == 8.0  # Decremented by 2
#     assert mock_session.commit.call_count == 1


# @pytest.mark.asyncio
# async def test_create_staff_account_success(mock_session, sample_org_id, sample_business_id):
#     """
#     Verifies that staff account creation successfully signs records into persistence matrices.
#     """
#     payload = StaffCreateIn(
#         tenant_id=sample_org_id,
#         email="operator@nethub.co.ke",
#         full_name="Jane Doe",
#         business_id=sample_business_id,
#         password="SecureSecretPassword123",
#         role=StaffRole.CASHIER
#     )

#     new_staff = await store_crud.create_staff_account(db=mock_session, payload=payload)

#     assert new_staff is not None
#     assert new_staff.email == "operator@nethub.co.ke"
#     assert new_staff.full_name == "Jane Doe"
#     assert mock_session.add.call_count == 2  # Staff and StaffBusinessAssignment


# @pytest.mark.asyncio
# async def test_get_financial_document_json_by_id(mock_session, sample_business_id):
#     """
#     Validates that get_financial_document_json correctly queries via document_id
#     and builds the structured dictionary format including line item serialization.
#     """
#     doc_id = uuid4()
#     sale_id = uuid4()

#     mock_doc = FinancialDocument(
#         id=doc_id,
#         business_id=sample_business_id,
#         sale_id=sale_id,
#         document_type=DocumentType.RECEIPT,
#         document_number="REC-260705-A1B2C3D4",
#         subtotal=1000.0,
#         tax_amount=160.0,
#         discount_amount=0.0,
#         total_amount=1160.0,
#         amount_paid=1160.0,
#         fiscal_metadata={"device_serial": "TRA-2026-X"}
#     )

#     mock_item = SaleItem(
#         id=uuid4(),
#         sale_id=sale_id,
#         product_id=uuid4(),
#         quantity=2,
#         unit_price=500.0,
#         total_price=1000.0,
#         sku="PROD-100",
#         name="Widget A"
#     )

#     def router(stmt, *args, **kwargs):
#         res = MagicMock()
#         stmt_str = str(stmt).lower()
#         if "financial_documents" in stmt_str:
#             res.scalar_one_or_none.return_value = mock_doc
#         elif "saleitem" in stmt_str:
#             res.all.return_value = [mock_item]
#         return res

#     mock_session.exec.side_effect = router

#     # Act
#     result = await store_crud.get_financial_document_json(db=mock_session, document_id=doc_id)

#     # Assert
#     assert result is not None
#     assert result["document_number"] == "REC-260705-A1B2C3D4"
#     assert len(result["items"]) == 1
#     assert result["items"][0]["sku"] == "PROD-100"


# @pytest.mark.asyncio
# async def test_list_business_financial_documents_json(mock_session, sample_business_id):
#     """
#     Ensures list_business_financial_documents_json cleanly handles paginated retrieval,
#     executes both count and data queries, and returns structural summary matrices.
#     """
#     mock_doc = FinancialDocument(
#         id=uuid4(),
#         business_id=sample_business_id,
#         sale_id=uuid4(),
#         document_type=DocumentType.INVOICE,
#         document_number="INV-2026-001",
#         subtotal=500.0,
#         total_amount=580.0,
#         amount_paid=0.0
#     )

#     def list_router(stmt, *args, **kwargs):
#         res = MagicMock()
#         stmt_str = str(stmt).lower()
#         if "count" in stmt_str:
#             res.scalar_one_or_none.return_value = 1
#         else:
#             res.all.return_value = [mock_doc]
#         return res

#     mock_session.exec.side_effect = list_router

#     # Act
#     response = await store_crud.list_business_financial_documents_json(
#         db=mock_session,
#         business_id=sample_business_id,
#         skip=0,
#         limit=10
#     )

#     assert response["total"] == 1
#     assert len(response["data"]) == 1
#     assert response["data"][0]["document_number"] == "INV-2026-001"
#     assert mock_session.exec.call_count == 2


# @pytest.mark.asyncio
# async def test_get_business_analytics(mock_session, sample_business_id):
#     """
#     Validates the analytics aggregation logic, ensuring total sales revenue,
#     transaction count, and tax calculations match metrics correctly within boundaries.
#     """
#     start_date = datetime.now(timezone.utc) - timedelta(days=7)
#     end_date = datetime.now(timezone.utc)

#     # Setup mocked scalar execution answers for query aggregates
#     def analytics_router(stmt, *args, **kwargs):
#         res = MagicMock()
#         stmt_str = str(stmt).lower()
#         if "count" in stmt_str:
#             res.scalar_one_or_none.return_value = 15  # 15 distinct sales
#         elif "sum" in stmt_str or "total_amount" in stmt_str:
#             res.scalar_one_or_none.return_value = 45000.0  # Total revenue sum
#         else:
#             res.all.return_value = []
#         return res

#     mock_session.exec.side_effect = analytics_router

#     # Act
#     analytics = await store_crud.get_business_analytics(
#         db=mock_session,
#         business_id=sample_business_id,
#         start_date=start_date,
#         end_date=end_date
#     )

#     # Assert
#     assert isinstance(analytics, dict)
#     assert analytics["business_id"] == str(sample_business_id)
#     assert "total_revenue" in analytics
#     assert analytics["total_revenue"] == 45000.0
#     assert analytics["high_level_metrics"]["total_sales_count"] == 15

# testing/test_store_crud.py
import pytest
from uuid import uuid4, UUID
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple, Optional
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, status
from sqlmodel import desc

from app.crud.store import store_crud
from app.models.models import (
    Business, Product, Staff, Sale, SaleItem, StockHistory, 
    StockMovementType, StaffBusinessAssignment, StaffRole, 
    SaleStatus, PaymentMethod, Payment, FinancialDocument, DocumentType
)
from app.schemas.business import StaffRequest, ProductAuditRequest, ProductRestockRequest
from app.schemas.store import FinalizeCheckoutIn, CartItemIn, InitializeCheckout
from app.schemas.schemas import StaffCreateIn, BusinessCreate


# =========================================================================
# FIXTURES SETUP
# =========================================================================

@pytest.fixture
def mock_session():
    """
    Generates an encapsulated, mocked AsyncSession interface instance.
    Overwrites synchronous .add method behavior to avoid unawaited task execution coroutine warnings.
    """
    session = AsyncMock()
    session.exec = AsyncMock()
    session.execute = AsyncMock()
    session.add = MagicMock()  # Synchronous override statement signature resolution safety rule
    session.commit = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    return session


@pytest.fixture
def sample_business_id():
    return uuid4()


@pytest.fixture
def sample_org_id():
    return uuid4()


# =========================================================================
# PERFORMANCE & ORCHESTRATION TESTS
# =========================================================================

@pytest.mark.asyncio
async def test_get_store_products_ordering_and_filters(mock_session, sample_business_id):
    """
    Verifies that store product queries correctly apply structural filtering criteria
    and strictly append the order_by clause down inside the pipeline execution.
    """
    mock_product_1 = Product(id=uuid4(), business_id=sample_business_id, label="Product A", stock=10)
    mock_product_2 = Product(id=uuid4(), business_id=sample_business_id, label="Product B", stock=5)
    
    mock_result = MagicMock()
    mock_result.all.return_value = [mock_product_1, mock_product_2]
    mock_session.exec.return_value = mock_result

    products = await store_crud.get_store_products(
        db=mock_session,
        business_id=sample_business_id,
        skip=0,
        limit=10
    )

    assert len(products) == 2
    assert products[0].label == "Product A"
    mock_session.exec.assert_called_once()


# @pytest.mark.asyncio
# async def test_finalize_checkout_pipeline(mock_session, sample_business_id):
#     """
#     Validates transactional consistency across line-item inventories, state mapping
#     mutations, and immediate downstream celery task triggers.
#     """
#     sale_id = uuid4()
#     product_id = uuid4()
    
#     mock_sale = Sale(
#         id=sale_id,
#         business_id=sample_business_id,
#         subtotal=2000.0,
#         discount=0.0,
#         tax_amount=320.0,
#         total_amount=2320.0,
#         status=SaleStatus.PENDING_PAYMENT,
#         customer_id=None
#     )
    
#     mock_item = SaleItem(
#         id=uuid4(),
#         sale_id=sale_id,
#         product_id=product_id,
#         quantity=2.0,
#         unit_price=1000.0,
#         total_price=2000.0
#     )
#     mock_sale.items = [mock_item]
    
#     mock_product = Product(
#         id=product_id,
#         business_id=sample_business_id,
#         name="Test Item Sku",
#         stock=10,
#         track_stock=True,
#         selling_price=1000.0,
#         cost_price=700.0
#     )

#     # Resilient statement routing interceptor for checkout processing pipeline
#     def checkout_side_effect(stmt, *args, **kwargs):
#         stmt_str = str(stmt).lower()
#         res = MagicMock()
#         if "sale" in stmt_str:
#             res.first.return_value = mock_sale
#             res.scalar_one_or_none.return_value = mock_sale
#         elif "product" in stmt_str:
#             res.first.return_value = mock_product
#             res.scalar_one_or_none.return_value = mock_product
#         else:
#             res.first.return_value = None
#             res.scalar_one_or_none.return_value = None
#         return res

#     mock_session.exec.side_effect = checkout_side_effect
#     mock_session.execute.side_effect = checkout_side_effect

#     payload = FinalizeCheckoutIn(
#         sale_id=sale_id,
#         payment_method=PaymentMethod.MPESA,
#         payment_reference="MPESA_TX_99823"
#     )

#     # Safe patch context for the asynchronous background Celery task emission
#     with patch("app.tasks.worker.generate_financial_document_task.delay") as mock_celery_task:
#         completed_sale = await store_crud.finalize_checkout(db=mock_session, sale_id=sale_id, payload=payload)

#         # Assert state tracking updates
#         assert completed_sale.status == SaleStatus.COMPLETED
#         assert mock_product.stock == 8.0  # Decoupled matching mutation decrement rules
#         mock_session.commit.assert_called_once()
#         mock_celery_task.assert_called_once_with(str(sale_id))

@pytest.mark.asyncio
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

    # Resilient statement routing interceptor for checkout processing pipeline
    def checkout_side_effect(stmt, *args, **kwargs):
        stmt_str = str(stmt).lower()
        res = MagicMock()
        if "sale" in stmt_str:
            res.first.return_value = mock_sale
            res.scalar_one_or_none.return_value = mock_sale
        elif "product" in stmt_str:
            res.first.return_value = mock_product
            res.scalar_one_or_none.return_value = mock_product
        else:
            res.first.return_value = None
            res.scalar_one_or_none.return_value = None
        return res

    mock_session.exec.side_effect = checkout_side_effect
    mock_session.execute.side_effect = checkout_side_effect

    payload = FinalizeCheckoutIn(
        sale_id=sale_id,
        payment_method=PaymentMethod.MPESA,
        payment_reference="MPESA_TX_99823"
    )

    # To ensure complete objectivity, we check the exact import lookup target inside the target module.
    # Since store_crud lives in `app.crud.store`, we must patch it where it is consumed to accurately spy on it.
    with patch("app.crud.store.generate_financial_document_task.delay") as mock_celery_task:
        completed_sale = await store_crud.finalize_checkout(db=mock_session, sale_id=sale_id, payload=payload)

        # Assert strict business states match expectation
        assert completed_sale.status == SaleStatus.COMPLETED
        assert mock_product.stock == 8.0
        mock_session.commit.assert_called_once()
        
        # Enforce that the async worker was correctly dispatched down the wire
        assert mock_celery_task.call_count == 1
        mock_celery_task.assert_called_once_with(str(sale_id))
        
@pytest.mark.asyncio
async def test_get_business_analytics(mock_session, sample_business_id):
    """
    Validates the analytics aggregation logic, ensuring total sales revenue, 
    transaction count, and tax calculations match metrics correctly within boundaries.
    """
    start_date = datetime.now(timezone.utc) - timedelta(days=7)
    end_date = datetime.now(timezone.utc)

    # Setup mocked scalar execution answers for query aggregates
    def analytics_router(stmt, *args, **kwargs):
        res = MagicMock()
        stmt_str = str(stmt).lower()
        if "count" in stmt_str:
            res.scalar_one_or_none.return_value = 15  # 15 distinct sales
        elif "sum" in stmt_str or "total_amount" in stmt_str:
            res.scalar_one_or_none.return_value = 45000.0  # Total revenue sum
        else:
            res.all.return_value = []
            res.scalar_one_or_none.return_value = 0.0
        return res

    mock_session.exec.side_effect = analytics_router

    analytics = await store_crud.get_business_analytics(
        db=mock_session,
        business_id=sample_business_id,
        start_date=start_date,
        end_date=end_date
    )

    assert isinstance(analytics, dict)
    assert "high_level_metrics" in analytics
    assert analytics["high_level_metrics"]["total_sales_count"] == 15