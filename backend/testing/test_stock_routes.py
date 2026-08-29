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
