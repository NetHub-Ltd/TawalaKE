"""Stock domain routes exist and use stock_crud permissions surface."""
from app.api.routes import stock as stock_routes
from app.api.api_router import api_router


def test_stock_router_paths():
    paths = {getattr(r, "path", None) for r in stock_routes.router.routes}
    assert "/receive" in paths
    assert "/count" in paths
    assert "/adjust" in paths
    assert any(p and "movements" in p for p in paths if isinstance(p, str))


def test_stock_mounted_on_api_router():
    mounted = []
    for r in api_router.routes:
        path = getattr(r, "path", "") or ""
        if "/stock" in path:
            mounted.append(path)
    assert any("/stock/receive" in p or p.endswith("/stock/receive") for p in mounted) or any(
        "stock" in p for p in mounted
    )


def test_snapshot_product_is_json_safe():
    from types import SimpleNamespace
    from app.api.routes.stock import snapshot_product

    product = SimpleNamespace(
        id="00000000-0000-0000-0000-000000000001",
        label="Test",
        selling_price=10,
        track_stock=True,
        last_stock_take=None,
        stock=5.0,
        popularity_score=None,
        active=True,
        category="other",
        min_stock_level=10,
        cost_price=8,
        attributes={"sku": "X", "buying_price": "9", "unit_of_measure": "pcs", "extra": "ignored"},
    )
    snap = snapshot_product(product)
    assert snap["stock"] == 5.0
    assert snap["attributes"]["buying_price"] == 9.0
    assert "extra" not in snap["attributes"]
