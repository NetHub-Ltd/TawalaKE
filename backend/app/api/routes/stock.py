"""
Stock domain HTTP API.

All quantity mutations and StockHistory reads go through stock_crud.
Catalogue metadata remains on /products. Checkout borrows stock_crud only.
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from app.api.deps import SessionDep, AuthUser, purge_cache_namespace, get_redis, AsyncRedis
from app.api.rbac_deps import require_permissions
from app.core.rbac import Permission
from app.crud.stock import stock_crud, ProductAdjustRequest
from app.models.models import Staff
from app.schemas.business import ProductAuditRequest, ProductRestockRequest
from app.schemas.schemas import ApiResponse, ProductResponse
from app.utils.logging import logger

router = APIRouter()


def product_response(product) -> ProductResponse:
    """Safe Product → ProductResponse (avoids 500 on response validation)."""
    raw_attrs = getattr(product, "attributes", None) or {}
    if not isinstance(raw_attrs, dict):
        raw_attrs = {}
    # Only known BaseAttributes keys; coerce types so response_model never 500s after a successful write
    buying = raw_attrs.get("buying_price")
    try:
        buying_f = float(buying) if buying is not None and buying != "" else None
    except (TypeError, ValueError):
        buying_f = None
    attrs = {
        "unit_of_measure": (str(raw_attrs["unit_of_measure"]) if raw_attrs.get("unit_of_measure") is not None else None),
        "buying_price": buying_f,
        "sku": (str(raw_attrs["sku"]) if raw_attrs.get("sku") is not None else None),
    }
    try:
        return ProductResponse(
            id=product.id,
            label=str(product.label or ""),
            selling_price=float(product.selling_price or 0),
            track_stock=bool(product.track_stock),
            last_stock_take=getattr(product, "last_stock_take", None),
            stock=float(product.stock or 0),
            popularity_score=(
                float(product.popularity_score)
                if getattr(product, "popularity_score", None) is not None
                else None
            ),
            active=bool(getattr(product, "active", True)),
            category=str(getattr(product, "category", None) or "General"),
            attributes=attrs,
        )
    except Exception as exc:
        logger.exception("product_response validation failed for product_id=%s: %s", getattr(product, "id", None), exc)
        # Minimal payload still satisfies response_model
        return ProductResponse(
            id=product.id,
            label=str(getattr(product, "label", "") or "Product"),
            selling_price=0.0,
            track_stock=True,
            last_stock_take=None,
            stock=float(getattr(product, "stock", 0) or 0),
            popularity_score=None,
            active=True,
            category="General",
            attributes={},
        )


@router.post(
    "/receive",
    response_model=ApiResponse[ProductResponse],
    summary="Receive stock (inbound supply)",
)
async def receive_stock(
    payload: ProductRestockRequest,
    db: SessionDep,
    current_staff: Staff = Depends(require_permissions(Permission.STOCK_ADJUST)),
    redis_client: AsyncRedis = Depends(get_redis),
):
    product = await stock_crud.restock(
        db=db, payload=payload, current_user=current_staff
    )
    try:
        await purge_cache_namespace(
            redis_client, namespace="products", business_id=product.business_id
        )
    except Exception as cache_err:
        logger.warning("stock.receive cache purge failed: %s", cache_err)
    data = product_response(product)
    logger.info("stock.receive product_id=%s stock=%s", product.id, product.stock)
    return ApiResponse(status=True, status_code=200, message="Success", data=data)


@router.post(
    "/count",
    response_model=ApiResponse[ProductResponse],
    summary="Physical stock count (absolute quantity)",
)
async def count_stock(
    payload: ProductAuditRequest,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.STOCK_ADJUST)),
    redis_client: AsyncRedis = Depends(get_redis),
):
    product = await stock_crud.count_stock(db=db, payload=payload, current_user=user)
    try:
        await purge_cache_namespace(
            redis_client, namespace="products", business_id=product.business_id
        )
    except Exception as cache_err:
        logger.warning("stock.count cache purge failed: %s", cache_err)
    return ApiResponse(
        status=True, status_code=200, message="Success", data=product_response(product)
    )


@router.post(
    "/adjust",
    response_model=ApiResponse[ProductResponse],
    summary="Manual stock adjustment (+/- with reason)",
)
async def adjust_stock(
    payload: ProductAdjustRequest,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.STOCK_ADJUST)),
    redis_client: AsyncRedis = Depends(get_redis),
):
    product = await stock_crud.adjust_stock(db=db, payload=payload, current_user=user)
    try:
        await purge_cache_namespace(
            redis_client, namespace="products", business_id=product.business_id
        )
    except Exception as cache_err:
        logger.warning("stock.adjust cache purge failed: %s", cache_err)
    return ApiResponse(
        status=True, status_code=200, message="Success", data=product_response(product)
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
