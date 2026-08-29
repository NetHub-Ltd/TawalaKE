"""
Stock domain HTTP API.

Mutation endpoints commit first, then return a plain JSON snapshot.
Nothing after a successful commit may turn the HTTP response into 500.
"""
from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from app.api.deps import SessionDep, purge_cache_namespace, get_redis, AsyncRedis
from app.api.rbac_deps import require_permissions
from app.core.rbac import Permission
from app.crud.stock import stock_crud, ProductAdjustRequest
from app.models.models import Staff
from app.schemas.business import ProductAuditRequest, ProductRestockRequest
from app.schemas.schemas import ApiResponse
from app.utils.logging import logger

router = APIRouter()


def _safe_float(value: Any, default: float | None = None) -> float | None:
    if value is None or value == "":
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_iso(value: Any) -> str | None:
    if value is None:
        return None
    try:
        if hasattr(value, "isoformat"):
            return value.isoformat()
        return str(value)
    except Exception:
        return None


def snapshot_product(product) -> dict[str, Any]:
    """JSON-safe product dict. Never raises."""
    try:
        raw_attrs = getattr(product, "attributes", None) or {}
        if not isinstance(raw_attrs, dict):
            raw_attrs = {}
        return {
            "id": str(getattr(product, "id", "") or ""),
            "label": str(getattr(product, "label", "") or ""),
            "selling_price": _safe_float(getattr(product, "selling_price", 0), 0.0) or 0.0,
            "track_stock": bool(getattr(product, "track_stock", True)),
            "last_stock_take": _safe_iso(getattr(product, "last_stock_take", None)),
            "stock": _safe_float(getattr(product, "stock", 0), 0.0) or 0.0,
            "popularity_score": _safe_float(getattr(product, "popularity_score", None)),
            "active": bool(getattr(product, "active", True)),
            "category": str(getattr(product, "category", None) or "General"),
            "min_stock_level": _safe_float(getattr(product, "min_stock_level", 10), 10.0) or 10.0,
            "cost_price": _safe_float(getattr(product, "cost_price", None)),
            "attributes": {
                "unit_of_measure": (
                    str(raw_attrs["unit_of_measure"])
                    if raw_attrs.get("unit_of_measure") is not None
                    else None
                ),
                "buying_price": _safe_float(raw_attrs.get("buying_price")),
                "sku": (
                    str(raw_attrs["sku"]) if raw_attrs.get("sku") is not None else None
                ),
            },
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("snapshot_product failed: %s", exc)
        return {
            "id": str(getattr(product, "id", "") or ""),
            "label": str(getattr(product, "label", "") or ""),
            "selling_price": 0.0,
            "track_stock": True,
            "last_stock_take": None,
            "stock": _safe_float(getattr(product, "stock", 0), 0.0) or 0.0,
            "popularity_score": None,
            "active": True,
            "category": "General",
            "min_stock_level": 10.0,
            "cost_price": None,
            "attributes": {
                "unit_of_measure": None,
                "buying_price": None,
                "sku": None,
            },
        }


def mutation_ok(
    product,
    *,
    before: float,
    after: float,
    message: str = "Success",
    business_id: Any = None,
) -> JSONResponse:
    """
    Always return HTTP 200 with status:true after a successful write.
    Snapshot failures fall back to a minimal payload — never 500.
    """
    try:
        data = {
            **snapshot_product(product),
            "previous_stock": float(before),
            "new_stock": float(after),
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("mutation_ok snapshot failed: %s", exc)
        data = {
            "id": str(getattr(product, "id", "") or ""),
            "stock": float(after),
            "previous_stock": float(before),
            "new_stock": float(after),
            "business_id": str(business_id) if business_id is not None else None,
        }
    body = {
        "status": True,
        "status_code": 200,
        "message": message,
        "data": data,
    }
    return JSONResponse(status_code=200, content=body)


def _business_id(product) -> Any:
    try:
        return getattr(product, "business_id", None)
    except Exception:
        return None


@router.post("/receive", summary="Receive stock (inbound supply)")
async def receive_stock(
    payload: ProductRestockRequest,
    db: SessionDep,
    current_staff: Staff = Depends(require_permissions(Permission.STOCK_ADJUST)),
    redis_client: AsyncRedis = Depends(get_redis),
):
    product, before, after = await stock_crud.restock(
        db=db, payload=payload, current_user=current_staff
    )
    biz = _business_id(product)
    try:
        if biz is not None:
            await purge_cache_namespace(
                redis_client, namespace="products", business_id=biz
            )
    except Exception as cache_err:
        logger.warning("stock.receive cache purge failed: %s", cache_err)
    try:
        logger.info("stock.receive product_id=%s stock=%s", getattr(product, "id", None), after)
    except Exception:
        pass
    return mutation_ok(
        product, before=before, after=after, message="Stock received", business_id=biz
    )


@router.post("/count", summary="Physical stock count (absolute quantity)")
async def count_stock(
    payload: ProductAuditRequest,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.STOCK_ADJUST)),
    redis_client: AsyncRedis = Depends(get_redis),
):
    product, before, after = await stock_crud.count_stock(
        db=db, payload=payload, current_user=user
    )
    biz = _business_id(product)
    try:
        if biz is not None:
            await purge_cache_namespace(
                redis_client, namespace="products", business_id=biz
            )
    except Exception as cache_err:
        logger.warning("stock.count cache purge failed: %s", cache_err)
    return mutation_ok(
        product, before=before, after=after, message="Stock count saved", business_id=biz
    )


@router.post("/adjust", summary="Manual stock adjustment (+/- with reason)")
async def adjust_stock(
    payload: ProductAdjustRequest,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.STOCK_ADJUST)),
    redis_client: AsyncRedis = Depends(get_redis),
):
    product, before, after = await stock_crud.adjust_stock(
        db=db, payload=payload, current_user=user
    )
    biz = _business_id(product)
    try:
        if biz is not None:
            await purge_cache_namespace(
                redis_client, namespace="products", business_id=biz
            )
    except Exception as cache_err:
        logger.warning("stock.adjust cache purge failed: %s", cache_err)
    return mutation_ok(
        product, before=before, after=after, message="Stock adjusted", business_id=biz
    )


@router.get(
    "/movements/{business_id}/{product_id}",
    response_model=ApiResponse[dict],
    summary="Stock movement history for a product",
)
async def list_stock_movements(
    business_id: UUID,
    product_id: UUID,
    db: SessionDep,
    _user: Staff = Depends(require_permissions(Permission.STOCK_READ)),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    rows, total = await stock_crud.list_movements(
        db, business_id=business_id, product_id=product_id, limit=limit, offset=offset
    )
    return ApiResponse(
        status=True,
        status_code=200,
        message="Success",
        data={"items": rows, "total": total},
    )
