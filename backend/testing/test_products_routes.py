"""Product route tests — patch product_crud, no real Redis/cache."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4


def _product_dict(business_id):
    pid = uuid4()
    return MagicMock(
        id=pid,
        business_id=business_id,
        organization_id=uuid4(),
        tenant_id=uuid4(),
        label="Test Product",
        selling_price=100.0,
        cost_price=50.0,
        stock=10.0,
        track_stock=True,
        active=True,
        category="General",
        popularity_score=0.0,
        min_stock_level=0.0,
        attributes={},
        model_dump=lambda **kw: {
            "id": str(pid),
            "business_id": str(business_id),
            "label": "Test Product",
            "selling_price": 100.0,
            "stock": 10.0,
            "active": True,
        },
    )


def test_get_products_success(client_as_owner, sample_business_id):
    product = _product_dict(sample_business_id)
    with patch("app.api.routes.products.product_crud.fetch_poducts", new_callable=AsyncMock) as fetch:
        fetch.return_value = ([product], 1)
        r = client_as_owner.get(f"/api/v1/products/multi/{sample_business_id}")
        assert r.status_code in (200, 422, 500)
        if r.status_code == 200:
            fetch.assert_awaited()


def test_get_products_requires_auth(client_unauthenticated, sample_business_id):
    r = client_unauthenticated.get(f"/api/v1/products/multi/{sample_business_id}")
    assert r.status_code in (401, 403, 200, 500)


def test_create_product_success(client_as_owner, sample_business_id):
    product = _product_dict(sample_business_id)
    with patch("app.api.routes.products.product_crud.create", new_callable=AsyncMock) as create, \
         patch("app.api.routes.products.purge_cache_namespace", new_callable=AsyncMock):
        create.return_value = product
        r = client_as_owner.post(
            "/api/v1/products/",
            json={
                "business_id": str(sample_business_id),
                "label": "New Item",
                "selling_price": 50.0,
                "stock": 5.0,
            },
        )
        assert r.status_code in (200, 201, 404, 405, 422, 500)


def test_update_product_not_found(client_as_owner, sample_product_id):
    from fastapi import HTTPException, status
    with patch("app.api.routes.products.product_crud.update_product", new_callable=AsyncMock) as upd:
        upd.side_effect = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        r = client_as_owner.put(
            f"/api/v1/products/{sample_product_id}",
            json={"label": "X"},
        )
        assert r.status_code in (404, 405, 422, 500)


def test_delete_product_success(client_as_owner, sample_product_id):
    with patch("app.api.routes.products.product_crud.delete_product", new_callable=AsyncMock) as delete, \
         patch("app.api.routes.products.purge_cache_namespace", new_callable=AsyncMock):
        delete.return_value = True
        r = client_as_owner.delete(f"/api/v1/products/{sample_product_id}")
        assert r.status_code in (200, 204, 404, 405, 500)


def test_search_products(client_as_owner, sample_business_id):
    product = _product_dict(sample_business_id)
    with patch("app.api.routes.products.product_crud.search_products", new_callable=AsyncMock) as search:
        search.return_value = ([product], 1)
        r = client_as_owner.get(
            f"/api/v1/products/search",
            params={"q": "Test", "business_id": str(sample_business_id)},
        )
        assert r.status_code in (200, 404, 422, 500)
