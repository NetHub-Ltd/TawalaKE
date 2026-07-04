# testing/test_product_crud.py
import pytest
from uuid import uuid4, UUID
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

# Import your actual core items cleanly
from app.models.models import Product
from app.schemas.schemas import ProductCreate, ProductUpdate
from app.crud.product import product_crud  # Assuming this is where ProductCrud is initialized


@pytest.fixture
def mock_session():
    """
    Generates an isolated, mocked AsyncSession container.
    Overrides synchronous methods like session.add to prevent unawaited coroutine warnings.
    """
    session = AsyncMock(spec=AsyncSession)
    session.add = MagicMock()  # AsyncSession.add is synchronous in SQLAlchemy
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    
    # Mock context manager lifecycles
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=None)
    return session


@pytest.fixture
def sample_product():
    """Returns a valid instantiated mock instance of the Product model."""
    return Product(
        id=uuid4(),
        tenant_id=uuid4(),
        organization_id=uuid4(),
        business_id=uuid4(),
        label="Premium Enterprise Subscription Router",
        selling_price=499.99,
        cost_price=250.00,
        track_stock=True,
        stock=15.0,
        popularity_score=4.8,
        min_stock_level=5.0,
        last_stock_take=datetime.now(timezone.utc),
        active=True,
        category="Hardware",
        attributes={"speed": "10Gbps", "rack_units": "1U"}
    )


# ---------------------------------------------------------------------------------
# 1. Fetch Products Logic (Base Class Delegations)
# ---------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_fetch_products_delegates_to_get_multi_safely(mock_session, sample_product):
    """Ensures fetch_poducts routes through get_multi with correct pagination boundaries."""
    mock_all_res = MagicMock()
    mock_all_res.all.return_value = [sample_product]
    mock_session.exec.return_value = mock_all_res

    # Testing historical typo variant to guarantee zero breaking changes down the line
    results = await product_crud.fetch_poducts(mock_session, limit=10, skip=5)

    assert len(results) == 1
    assert results[0].label == "Premium Enterprise Subscription Router"
    mock_session.exec.assert_called_once()
    
    # Assert underlying pagination parameters were correctly compiled
    stmt = mock_session.exec.call_args[0][0]
    assert "limit :param_1 offset :param_2" in str(stmt).lower() or ("limit" in str(stmt).lower() and "offset" in str(stmt).lower())


# ---------------------------------------------------------------------------------
# 2. Update Product Logic
# ---------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_product_success_path(mock_session, sample_product):
    """Validates successful operational mutation workflows and proper transactional commit execution."""
    update_payload = ProductUpdate(label="Updated Router Label", selling_price=520.00)

    # Mock the internal GET fetching lookups and subsequent mutation engines
    with patch.object(product_crud, "get", AsyncMock(return_value=sample_product)), \
         patch.object(product_crud, "update", AsyncMock(return_value=sample_product)):
        
        updated_result = await product_crud.update_product(
            product_id=sample_product.id, 
            payload=update_payload, 
            db=mock_session
        )

        assert updated_result is not None
        mock_session.commit.assert_called_once()
        mock_session.rollback.assert_not_called()


@pytest.mark.asyncio
async def test_update_product_raises_404_when_missing(mock_session):
    """Guarantees a 404 HTTPException is thrown immediately if the target resource does not exist."""
    missing_id = uuid4()
    update_payload = ProductUpdate(label="Ghost Product Update")

    with patch.object(product_crud, "get", AsyncMock(return_value=None)):
        with pytest.raises(HTTPException) as exc_info:
            await product_crud.update_product(product_id=missing_id, payload=update_payload, db=mock_session)

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Product not found" in exc_info.value.detail
        mock_session.commit.assert_not_called()


# ---------------------------------------------------------------------------------
# 3. Delete Product Logic
# ---------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_delete_product_success_path(mock_session, sample_product):
    """Ensures delete routines fetch, remove, and commit the atomic change safely."""
    with patch.object(product_crud, "get", AsyncMock(return_value=sample_product)), \
         patch.object(product_crud, "remove", AsyncMock(return_value=sample_product)):
        
        status_outcome = await product_crud.delete_product(product_id=sample_product.id, db=mock_session)

        assert status_outcome is True
        mock_session.commit.assert_called_once()


@pytest.mark.asyncio
async def test_delete_product_raises_404_when_missing(mock_session):
    """Ensures deletion targets that do not exist trigger 404 states without hitting commit layers."""
    missing_id = uuid4()

    with patch.object(product_crud, "get", AsyncMock(return_value=None)):
        with pytest.raises(HTTPException) as exc_info:
            await product_crud.delete_product(product_id=missing_id, db=mock_session)

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        mock_session.commit.assert_not_called()


# ---------------------------------------------------------------------------------
# 4. Fetch Business Products Logic
# ---------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_fetch_business_products_applies_correct_filters(mock_session, sample_product):
    """Guarantees attributes filtration routes specifically by business_id context markers."""
    mock_all_res = MagicMock()
    mock_all_res.all.return_value = [sample_product]
    mock_session.exec.return_value = mock_all_res

    target_business_id = sample_product.business_id
    results = await product_crud.fetch_business_products(
        business_id=target_business_id, 
        db=mock_session, 
        limit=20
    )

    assert len(results) == 1
    # Verify statement targeted business filtering
    stmt = mock_session.exec.call_args[0][0]
    assert "business_id" in str(stmt).lower()


# ---------------------------------------------------------------------------------
# 5. Advanced Cross-Module Generic Search Engine Integration
# ---------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_search_products_executes_complex_multitenant_lookups(mock_session, sample_product):
    """
    Validates that search_products bundles parameters correctly into dynamic dictionaries,
    applies the textual search scopes on ('label', 'category'), and yields records along with full totals.
    """
    mock_count_res = MagicMock()
    mock_count_res.one.return_value = 142  # Large scale match count simulation
    
    mock_records_res = MagicMock()
    mock_records_res.all.return_value = [sample_product]
    
    # Sequence execution: First handles the subquery total count, second fetches the page slice array
    mock_session.exec.side_effect = [mock_count_res, mock_records_res]

    records, total_count = await product_crud.search_products(
        db=mock_session,
        search_query="Router",
        business_id=sample_product.business_id,
        tenant_id=sample_product.tenant_id,
        category="Hardware",
        active=True,
        skip=0,
        limit=25
    )

    # Validate output schema match structures
    assert total_count == 142
    assert len(records) == 1
    assert records[0].label == "Premium Enterprise Subscription Router"
    assert mock_session.exec.call_count == 2

    # Validate the generated compilation statements look for multitenant fields and text masks
    count_stmt = str(mock_session.exec.call_args_list[0][0][0]).lower()
    records_stmt = str(mock_session.exec.call_args_list[1][0][0]).lower()

    assert "count" in count_stmt
    assert "business_id" in records_stmt
    assert "tenant_id" in records_stmt
    assert "category" in records_stmt
    assert "like" in records_stmt