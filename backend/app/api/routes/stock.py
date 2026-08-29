"""
Stock domain HTTP API.

Mutation endpoints return a plain JSON snapshot after commit so response
serialization cannot turn a successful write into HTTP 500.
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


def snapshot_product(product) -> dict[str, Any]:
    raw_attrs = getattr(product, "attributes", None) or {}
    if not isinstance(raw_attrs, dict):
        raw_attrs = {}
    buying = raw_attrs.get("buying_price")
    try:
        buying_f = float(buying) if buying is not None and buying != "" else None
    except (TypeError, ValueError):
        buying_f = None
    last = getattr(product, "last_stock_take", None)
    return {
        "id": str(product.id),
        "label": str(getattr(product, "label", "") or ""),
        "selling_price": float(getattr(product, "selling_price", 0) or 0),
        "track_stock": bool(getattr(product, "track_stock", True)),
        "last_stock_take": last.isoformat() if last is not None else None,
        "stock": float(getattr(product, "stock", 0) or 0),
        "popularity_score": (
            float(product.popularity_score)
            if getattr(product, "popularity_score", None) is not None
            else None
        ),
        "active": bool(getattr(product, "active", True)),
        "category": str(getattr(product, "category", None) or "General"),
        "min_stock_level": float(getattr(product, "min_stock_level", 10) or 10),
        "cost_price": (
            float(product.cost_price)
            if getattr(product, "cost_price", None) is not None
            else None
        ),
        "attributes": {
            "unit_of_measure": (
                str(raw_attrs["unit_of_measure"])
                if raw_attrs.get("unit_of_measure") is not None
                else None
            ),
            "buying_price": buying_f,
            "sku": str(raw_attrs["sku"]) if raw_attrs.get("sku") is not None else None,
        },
    }


def mutation_ok(product, *, before: float, after: float, message: str = "Success") -> JSONResponse:
    body = {
        "status": True,
        "status_code": 200,
        "message": message,
        "data": {
            **snapshot_product(product),
            "previous_stock": before,
            "new_stock": after,
        },
    }
    return JSONResponse(status_code=200, content=body)


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
    try:
        await purge_cache_namespace(
            redis_client, namespace="products", business_id=product.business_id
        )
    except Exception as cache_err:
        logger.warning("stock.receive cache purge failed: %s", cache_err)
    logger.info("stock.receive product_id=%s stock=%s", product.id, after)
    return mutation_ok(product, before=before, after=after, message="Stock received")


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
    try:
        await purge_cache_namespace(
            redis_client, namespace="products", business_id=product.business_id
        )
    except Exception as cache_err:
        logger.warning("stock.count cache purge failed: %s", cache_err)
    return mutation_ok(product, before=before, after=after, message="Stock count saved")


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
    try:
        await purge_cache_namespace(
            redis_client, namespace="products", business_id=product.business_id
        )
    except Exception as cache_err:
        logger.warning("stock.adjust cache purge failed: %s", cache_err)
    return mutation_ok(product, before=before, after=after, message="Stock adjusted")


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
