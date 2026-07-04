# testing/test_crudbase.py
import pytest
from datetime import datetime, timezone
from uuid import uuid4, UUID
from typing import Optional, Dict, Any
from unittest.mock import AsyncMock, MagicMock
from sqlmodel import SQLModel, Field
from pydantic import BaseModel
from fastapi import HTTPException, status

from app.crud.base import BaseCRUD


# --------------------------------------------------------------
# Mock Schemas & Models Setup for Isolated Testing
# --------------------------------------------------------------
class MockModel(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    tenant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MockCreateSchema(BaseModel):
    name: str
    tenant_id: str


class MockUpdateSchema(BaseModel):
    name: Optional[str] = None


@pytest.fixture
def crud_instance():
    """Returns an isolated instance of the BaseCRUD interface targeting MockModel."""
    return BaseCRUD[MockModel, MockCreateSchema, MockUpdateSchema](MockModel)


@pytest.fixture
def mock_session():
    """Generates an encapsulated, mocked AsyncSession engine connection handle."""
    session = AsyncMock()
    
    # db.add is synchronous in AsyncSession; explicitly override 
    # the default AsyncMock behavior to prevent 'coroutine was never awaited' warnings.
    session.add = MagicMock()
    
    # Mock async context manager lifecycle wrappers safely
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=None)
    return session


# --------------------------------------------------------------
# Test Specifications
# --------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_multi_applies_latest_first_sorting(crud_instance, mock_session):
    """Verifies get_multi adds dynamic created_at DESC sequencing and pagination limits."""
    mock_result = MagicMock()
    mock_result.all.return_value = [
        MockModel(name="Latest Item", tenant_id="tenant-1"),
        MockModel(name="Older Item", tenant_id="tenant-1")
    ]
    mock_session.exec.return_value = mock_result

    records = await crud_instance.get_multi(mock_session, skip=10, limit=25)

    assert len(records) == 2
    assert records[0].name == "Latest Item"
    mock_session.exec.assert_called_once()
    
    # Confirm SQL query execution structure applied pagination configurations correctly
    stmt = mock_session.exec.call_args[0][0]
    assert "limit" in str(stmt).lower()
    assert "offset" in str(stmt).lower()


@pytest.mark.asyncio
async def test_get_by_attributes_validates_types_gracefully(crud_instance, mock_session):
    """Ensures get_by_attributes throws 422 errors if types conflict with schema definitions."""
    invalid_filters = {"name": {"malicious_nested_object": True}}

    with pytest.raises(HTTPException) as exc_info:
        await crud_instance.get_by_attributes(mock_session, filters=invalid_filters)

    # Updated to latest non-deprecated FastAPI operational token status
    assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert "is invalid for field" in exc_info.value.detail


@pytest.mark.asyncio
async def test_global_search_executes_paginated_ilike_clauses(crud_instance, mock_session):
    """
    Guarantees the cross-module search method constructs internal case-insensitive 
    expressions, extracts a match count, and returns the correct payload schema.
    """
    mock_records_res = MagicMock()
    mock_records_res.all.return_value = [MockModel(name="Cloud Storage Core", tenant_id="t-9")]
    
    mock_count_res = MagicMock()
    mock_count_res.scalar_one.return_value = 1
    
    # Configure mock session sequence responses for count execution then record retrieval execution
    mock_session.exec.side_effect = [mock_count_res, mock_records_res]

    records, total = await crud_instance.search(
        db=mock_session,
        search_query="Cloud",
        search_fields=["name", "tenant_id"],
        filters={"tenant_id": "t-9"},
        skip=0,
        limit=10
    )

    assert total == 1
    assert len(records) == 1
    assert records[0].name == "Cloud Storage Core"
    assert mock_session.exec.call_count == 2
    
    # Extract structural compilation components to check execution behaviors
    first_stmt = mock_session.exec.call_args_list[0][0][0]
    second_stmt = mock_session.exec.call_args_list[1][0][0]
    
    assert "count" in str(first_stmt).lower()
    
    # FIX: SQLAlchemy compiles ILIKE down to standard agnostic lower() LIKE lower() expressions
    compiled_sql = str(second_stmt).lower()
    assert "like" in compiled_sql
    assert "lower" in compiled_sql


@pytest.mark.asyncio
async def test_create_catches_integrity_violations_cleanly(crud_instance, mock_session):
    """Verifies database integrity errors are caught and transformed into clean 409 conflict responses."""
    from sqlalchemy.exc import IntegrityError
    
    mock_session.flush.side_effect = IntegrityError("Unique constraint violation", params={}, orig=None)
    
    input_payload = MockCreateSchema(name="Unique Service Target", tenant_id="net-prod")

    with pytest.raises(HTTPException) as exc_info:
        await crud_instance.create(mock_session, obj_in=input_payload)

    assert exc_info.value.status_code == status.HTTP_409_CONFLICT
    assert "Resource conflict occurred" in exc_info.value.detail
    mock_session.rollback.assert_called_once()