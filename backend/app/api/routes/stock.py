"""
Stock domain HTTP API.

Mutation endpoints commit first, snapshot the product into a plain dict while
the session is still healthy, then the HTTP response is built only from
primitives — never from a possibly-poisoned ORM instance after audit failures.
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
    """JSON-safe product dict. Call only while the session is healthy."""
    try:
        state = getattr(product, "_sa_instance_state", None)
        ident = None
        if state is not None:
            try:
                ident = state.identity
            except Exception:
                ident = None
        pid = str(ident[0]) if ident else str(getattr(product, "id", "") or "")

        inst = getattr(product, "__dict__", {}) or {}

        def g(key: str, default: Any = None) -> Any:
            if key in inst and not str(key).startswith("_"):
                return inst.get(key, default)
            return getattr(product, key, default)

        raw_attrs = g("attributes") or {}
        if not isinstance(raw_attrs, dict):
            raw_attrs = {}

        biz = g("business_id")
        return {
            "id": pid,
            "label": str(g("label", "") or ""),
            "selling_price": _safe_float(g("selling_price", 0), 0.0) or 0.0,
            "track_stock": bool(g("track_stock", True)),
            "last_stock_take": _safe_iso(g("last_stock_take")),
            "stock": _safe_float(g("stock", 0), 0.0) or 0.0,
            "popularity_score": _safe_float(g("popularity_score")),
            "active": bool(g("active", True)),
            "category": str(g("category") or "General"),
            "min_stock_level": _safe_float(g("min_stock_level", 10), 10.0) or 10.0,
            "cost_price": _safe_float(g("cost_price")),
            "business_id": str(biz) if biz is not None else None,
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
            "id": "",
            "label": "",
            "selling_price": 0.0,
            "track_stock": True,
            "last_stock_take": None,
            "stock": 0.0,
            "popularity_score": None,
            "active": True,
            "category": "General",
            "min_stock_level": 10.0,
            "cost_price": None,
            "business_id": None,
            "attributes": {
                "unit_of_measure": None,
                "buying_price": None,
                "sku": None,
            },
        }


def mutation_ok_from_data(
    data: dict[str, Any],
    *,
    before: float,
    after: float,
    message: str = "Success",
) -> JSONResponse:
    """Build success response from a plain dict only — never touch ORM."""
    payload = {
        **data,
        "previous_stock": float(before),
        "new_stock": float(after),
        "stock": float(after),
    }
    return JSONResponse(
        status_code=200,
        content={
            "status": True,
            "status_code": 200,
            "message": message,
            "data": payload,
        },
    )


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
    # Snapshot WHILE session is healthy — before any further side effects.
    data = snapshot_product(product)
    biz = data.get("business_id")
    try:
        if biz is not None:
            await purge_cache_namespace(
                redis_client, namespace="products", business_id=biz
            )
    except Exception as cache_err:
        logger.warning("stock.receive cache purge failed: %s", cache_err)
    return mutation_ok_from_data(
        data, before=before, after=after, message="Stock received"
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
    data = snapshot_product(product)
    biz = data.get("business_id")
    try:
        if biz is not None:
            await purge_cache_namespace(
                redis_client, namespace="products", business_id=biz
            )
    except Exception as cache_err:
        logger.warning("stock.count cache purge failed: %s", cache_err)
    return mutation_ok_from_data(
        data, before=before, after=after, message="Stock count saved"
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
    data = snapshot_product(product)
    biz = data.get("business_id")
    try:
        if biz is not None:
            await purge_cache_namespace(
                redis_client, namespace="products", business_id=biz
            )
    except Exception as cache_err:
        logger.warning("stock.adjust cache purge failed: %s", cache_err)
    return mutation_ok_from_data(
        data, before=before, after=after, message="Stock adjusted"
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
