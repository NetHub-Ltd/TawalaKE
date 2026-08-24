"""Unit tests for SaleService."""
import pytest
from unittest.mock import MagicMock, AsyncMock
from uuid import uuid4

from app.crud.sale import SaleService


@pytest.fixture
def sale_service():
    return SaleService()


@pytest.mark.asyncio
async def test_sale_service_instantiate(sale_service):
    assert sale_service is not None


@pytest.mark.asyncio
async def test_sale_service_methods_exist(sale_service):
    methods = [m for m in dir(sale_service) if not m.startswith("_")]
    assert len(methods) >= 1
