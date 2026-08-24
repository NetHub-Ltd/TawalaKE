"""Unit tests for the generic BaseCRUD class."""
import pytest
from uuid import uuid4
from unittest.mock import MagicMock, AsyncMock
from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from app.crud.base import BaseCRUD
from app.models.models import Product
from app.schemas.schemas import ProductCreate, ProductUpdate


# A concrete CRUD instance for testing
product_crud = BaseCRUD(Product)


# ------------------------------------------------------------------
# 1. get() — Fetch by ID
# ------------------------------------------------------------------
@pytest.mark.asyncio
async def test_get_success(mock_session):
    """get() returns a single record when found."""
    product_id = uuid4()
    mock_product = MagicMock(spec=Product)
    mock_product.id = product_id
    mock_product.label = "Test Product"

    mock_result = MagicMock()
    mock_result.one_or_none.return_value = mock_product
    mock_session.exec.return_value = mock_result

    result = await product_crud.get(mock_session, product_id)

    assert result is mock_product
    assert result.label == "Test Product"
    mock_session.exec.assert_called_once()


@pytest.mark.asyncio
async def test_get_not_found(mock_session):
    """get() returns None when record does not exist."""
    mock_result = MagicMock()
    mock_result.one_or_none.return_value = None
    mock_session.exec.return_value = mock_result

    result = await product_crud.get(mock_session, uuid4())

    assert result is None


@pytest.mark.asyncio
async def test_get_database_error(mock_session):
    """get() raises 500 when database error occurs."""
    mock_session.exec.side_effect = SQLAlchemyError("Connection lost")

    with pytest.raises(HTTPException) as exc_info:
        await product_crud.get(mock_session, uuid4())

    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


# ------------------------------------------------------------------
# 2. get_multi() — List with pagination
# ------------------------------------------------------------------
@pytest.mark.asyncio
async def test_get_multi_with_default_order(mock_session):
    """get_multi() returns paginated results ordered by created_at desc."""
    mock_products = [MagicMock(spec=Product), MagicMock(spec=Product)]
    mock_result = MagicMock()
    mock_result.all.return_value = mock_products
    mock_session.exec.return_value = mock_result

    results = await product_crud.get_multi(mock_session, skip=0, limit=10)

    assert len(results) == 2
    mock_session.exec.assert_called_once()
    stmt = mock_session.exec.call_args[0][0]
    stmt_str = str(stmt).lower()
    assert "limit" in stmt_str
    assert "offset" in stmt_str


@pytest.mark.asyncio
async def test_get_multi_database_error(mock_session):
    """get_multi() raises 500 on database failure."""
    mock_session.exec.side_effect = SQLAlchemyError("Timeout")

    with pytest.raises(HTTPException) as exc_info:
        await product_crud.get_multi(mock_session)

    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


# ------------------------------------------------------------------
# 3. get_multi_paginated() — Paginated list with total count
# ------------------------------------------------------------------
@pytest.mark.asyncio
async def test_get_multi_paginated(mock_session):
    """get_multi_paginated() returns records and total count."""
    mock_products = [MagicMock(spec=Product), MagicMock(spec=Product)]

    mock_count_result = MagicMock()
    mock_count_result.scalar_one.return_value = 42

    mock_data_result = MagicMock()
    mock_data_result.all.return_value = mock_products

    mock_session.exec.side_effect = [mock_count_result, mock_data_result]

    records, total = await product_crud.get_multi_paginated(mock_session, skip=0, limit=10)

    assert total == 42
    assert len(records) == 2
    assert mock_session.exec.call_count == 2


# ------------------------------------------------------------------
# 4. get_by_attributes() — Filtered search
# ------------------------------------------------------------------
@pytest.mark.asyncio
async def test_get_by_attributes_success(mock_session):
    """get_by_attributes() filters by exact field matches."""
    mock_products = [MagicMock(spec=Product)]
    mock_result = MagicMock()
    mock_result.all.return_value = mock_products
    mock_session.exec.return_value = mock_result

    results = await product_crud.get_by_attributes(
        mock_session, filters={"active": True}, skip=0, limit=10
    )

    assert len(results) == 1
    stmt = mock_session.exec.call_args[0][0]
    assert "active" in str(stmt).lower()


@pytest.mark.asyncio
async def test_get_by_attributes_invalid_field(mock_session):
    """get_by_attributes() raises 400 for invalid field names."""
    with pytest.raises(HTTPException) as exc_info:
        await product_crud.get_by_attributes(
            mock_session, filters={"nonexistent_field": "value"}
        )

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


# ------------------------------------------------------------------
# 5. search() — Text search with pagination
# ------------------------------------------------------------------
@pytest.mark.asyncio
async def test_search_success(mock_session):
    """search() performs text search across searchable fields."""
    mock_products = [MagicMock(spec=Product)]

    mock_count_result = MagicMock()
    mock_count_result.one.return_value = 5

    mock_data_result = MagicMock()
    mock_data_result.all.return_value = mock_products

    mock_session.exec.side_effect = [mock_count_result, mock_data_result]

    records, total = await product_crud.search(
        mock_session, search_query="router", search_fields=["label"], skip=0, limit=20
    )

    assert total == 5
    assert len(records) == 1
    assert mock_session.exec.call_count == 2


# ------------------------------------------------------------------
# 6. create() — Insert new record
# ------------------------------------------------------------------
@pytest.mark.asyncio
async def test_create_success(mock_session):
    """create() persists a new record and returns it."""
    create_data = ProductCreate(
        label="New Product",
        selling_price=100.0,
        cost_price=50.0,
        track_stock=True,
        stock=10.0
    )

    result = await product_crud.create(mock_session, obj_in=create_data)

    assert result is not None
    mock_session.add.assert_called_once()
    mock_session.flush.assert_called_once()
    mock_session.refresh.assert_called_once()


@pytest.mark.asyncio
async def test_create_integrity_error(mock_session):
    """create() raises 409 on unique constraint violation."""
    mock_session.flush.side_effect = IntegrityError("stmt", "params", Exception("duplicate"))

    create_data = ProductCreate(label="Duplicate", selling_price=10.0)

    with pytest.raises(HTTPException) as exc_info:
        await product_crud.create(mock_session, obj_in=create_data)

    assert exc_info.value.status_code == status.HTTP_409_CONFLICT
    mock_session.rollback.assert_called_once()


# ------------------------------------------------------------------
# 7. update() — Modify existing record
# ------------------------------------------------------------------
@pytest.mark.asyncio
async def test_update_success(mock_session):
    """update() modifies fields and flushes changes."""
    mock_product = MagicMock(spec=Product)
    mock_product.id = uuid4()
    mock_product.label = "Old Label"
    mock_product.selling_price = 100.0

    update_data = ProductUpdate(label="Updated Label", selling_price=150.0)

    result = await product_crud.update(mock_session, db_obj=mock_product, obj_in=update_data)

    assert result is not None
    mock_session.add.assert_called_once()
    mock_session.flush.assert_called_once()
    mock_session.refresh.assert_called_once()


@pytest.mark.asyncio
async def test_update_not_found(mock_session):
    """update() returns None when db_obj is None."""
    update_data = ProductUpdate(label="Ghost")
    result = await product_crud.update(mock_session, db_obj=None, obj_in=update_data)
    assert result is None


# ------------------------------------------------------------------
# 8. remove() — Delete record
# ------------------------------------------------------------------
@pytest.mark.asyncio
async def test_remove_success(mock_session):
    """remove() deletes the record and flushes."""
    mock_product = MagicMock(spec=Product)
    mock_product.id = uuid4()

    mock_result = MagicMock()
    mock_result.one_or_none.return_value = mock_product
    mock_session.exec.return_value = mock_result

    result = await product_crud.remove(mock_session, id=mock_product.id)

    assert result is not None
    mock_session.delete.assert_called_once()
    mock_session.flush.assert_called_once()


@pytest.mark.asyncio
async def test_remove_database_error(mock_session):
    """remove() raises 500 on database failure."""
    mock_product = MagicMock(spec=Product)
    mock_product.id = uuid4()

    mock_result = MagicMock()
    mock_result.one_or_none.return_value = mock_product
    mock_session.exec.return_value = mock_result
    mock_session.delete.side_effect = SQLAlchemyError("Foreign key constraint")

    with pytest.raises(HTTPException) as exc_info:
        await product_crud.remove(mock_session, id=uuid4())

    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    mock_session.rollback.assert_called_once()
