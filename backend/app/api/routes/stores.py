from app.models.models import Staff
from typing import List, Optional, Sequence, TypeVar, Generic
from uuid import UUID
from datetime import date, datetime

from fastapi import APIRouter, HTTPException,BackgroundTasks, Depends, Request, status, Query

from app.api.deps import SessionDep, AuthUser, universal_key_builder, purge_cache_namespace, get_redis, AsyncRedis
from app.api.rbac_deps import require_permissions, purge_staff_rbac_cache
from app.core.rbac import Permission
from app.services.audit import record_audit
from app.crud.business import business_crud
from app.schemas.schemas import BusinessCreate, BusinessResponse, ApiResponse, \
    BusinessUpdate, BusinessBase
from app.schemas.business import RestockRequest, ProductAuditRequest, StaffRequest, ProductRestockRequest
from app.utils.logging import logger
from app.crud.store import store_crud
from app.crud.stock import stock_crud, ProductAdjustRequest
from app.crud.sale import InitializeCheckout, InitializeCheckoutRequest
from app.schemas.store import SaleResponse, FinalizeCheckoutIn, FinancialDocumentSnapshotSchema
from sqlmodel import select
from app.models.models import Sale, SaleAnalyticsSummary, Staff
from app.schemas.schemas import ProductResponse
from fastapi_cache.decorator import cache
from app.core.redis_client import limiter
from app.schemas.analytics import DashboardAnalyticsResponse
from app.utils.helpers import AnalyticsPeriod
from app.schemas.sale import SaleReadWithRelations
from pydantic import BaseModel
from app.api.deps import (
    SessionDep,
    get_redis,
    AsyncRedis,
    universal_key_builder,
    purge_cache_namespace,
)

router = APIRouter()


T = TypeVar("T")


class PaginationMeta(BaseModel):
    """Metadata envelope for paginated list responses."""

    total: int
    page: int
    page_size: int
    total_pages: int


class PaginatedData(BaseModel, Generic[T]):
    """Generic pagination wrapper for payload data."""

    items: List[T]
    meta: PaginationMeta


# --- Redis Cache Durations ---
CACHE_TTL_SEC = 300  # 5 minutes cache visibility matrix



def _product_response(product) -> ProductResponse:
    """Delegate to stock.product_response (hardened against validation 500s)."""
    from app.api.routes.stock import product_response
    return product_response(product)

@router.patch('/update-business/{business_id}', response_model=ApiResponse[BusinessResponse])
async def update_business(user: AuthUser, business_id:UUID, db: SessionDep, payload:BusinessUpdate, redis_client: AsyncRedis = Depends(get_redis)):
    """
    Updates the details of an existing business entity identified by its unique
    business ID. This function interacts with the database session to locate the
    target business record and applies the provided update payload to modify its
    attributes. It allows for modification of relevant business details while
    maintaining database integrity.

    :param user:
    :param business_id: Unique identifier of the business to be updated.
    :param db: Database session dependency for database operations.
    :param payload: Data object containing updated attributes for the business.
    :return: The updated business object reflecting the changes applied.
    :rtype: Business
    """
    db_obj = await business_crud.get_business_by_id(db, business_id)

    if db_obj.tenant_id != user.tenant_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    new = await business_crud.update_business(business_id, db=db, db_obj=payload)
    await purge_cache_namespace(redis_client, namespace="stores", business_id=new.id)
    return ApiResponse(
        status_code=200,
        message="Success",
        data=new,
        status=True,
    )
#
#
@router.delete('/delete/{business_id}', status_code=200, response_model=ApiResponse)
async def delete_client(user: AuthUser, db: SessionDep, business_id: UUID, redis_client: AsyncRedis = Depends(get_redis)):
    """
    Deletes a client business entity by its unique identifier. This endpoint removes
    the business entity from the database and returns a successful response if the
    operation completes successfully.

    :param user:
    :param db: Database session dependency used to interact with the database.
    :type db: SessionDep
    :param business_id: Unique identifier of the business entity to be deleted.
    :type business_id: UUID
    :return: Response model indicating the success or failure of the delete operation.
    :rtype: ApiResponse
    """
    biz = await business_crud.get_business_by_id(db, business_id)
    if biz.tenant_id != user.tenant_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    await business_crud.remove(db=db, id=business_id)
    await db.commit()
    
    await purge_cache_namespace(redis_client, namespace="stores", business_id=business_id)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Success",
    )


@router.post("/restock", response_model=ApiResponse[ProductResponse], deprecated=True)
async def restock_product(
    payload: ProductRestockRequest,
    db: SessionDep,
    current_staff: Staff = Depends(require_permissions(Permission.STOCK_ADJUST)),
    redis_client: AsyncRedis = Depends(get_redis),
):
    """
    Increments product inventory based on an incoming supply.
    Maintains an atomic history snapshot balance.
    """
    product, _b, _a = await stock_crud.restock(db=db, payload=payload, current_user=current_staff)
    await purge_cache_namespace(redis_client, namespace="products", business_id=product.business_id)

    data = _product_response(product)
    logger.info(f"restock response product_id={product.id} stock={product.stock}")

    return ApiResponse(
        status=True,
        status_code=200,
        message="Success",
        data=data,
    )

@router.post("/stock-audit", status_code=200, response_model=ApiResponse[ProductResponse], deprecated=True)
async def audit_product_stock(
    payload: ProductAuditRequest,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.STOCK_ADJUST)),
    redis_client: AsyncRedis = Depends(get_redis),
):
    """
    Reconciles physical counter reality audits with system database balances.
    Calculates the inventory variance delta and tracks loss anomalies.
    """
    product, _b, _a = await stock_crud.count_stock(db=db, payload=payload, current_user=user)
    await purge_cache_namespace(redis_client, namespace="products", business_id=product.business_id)
    data = _product_response(product)
    return ApiResponse(status=True, status_code=200, message="Success", data=data)




@router.post("/stock-adjust", response_model=ApiResponse[ProductResponse], deprecated=True)
async def adjust_product_stock(
    payload: ProductAdjustRequest,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.STOCK_ADJUST)),
    redis_client: AsyncRedis = Depends(get_redis),
):
    """Explicit increase/decrease with reason; writes StockHistory + audit."""
    product, _b, _a = await stock_crud.adjust_stock(db=db, payload=payload, current_user=user)
    await purge_cache_namespace(redis_client, namespace="products", business_id=product.business_id)
    data = _product_response(product)
    return ApiResponse(status=True, status_code=200, message="Success", data=data)


@router.get("/stock/movements/{business_id}/{product_id}", response_model=ApiResponse[dict], deprecated=True)
async def list_product_stock_movements(
    business_id: UUID,
    product_id: UUID,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.STOCK_READ)),
    limit: int = 50,
    offset: int = 0,
):
    """Paginated StockHistory for product workspace History tab."""
    rows, total = await stock_crud.list_movements(
        db, business_id=business_id, product_id=product_id, limit=limit, offset=offset
    )
    data = {"items": rows, "total": total}
    return ApiResponse(status=True, status_code=200, message="Success", data=data)


@router.post("/new-sale", status_code=200, response_model=SaleResponse)
async def create_pending_sale(
    payload: InitializeCheckoutRequest,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.SALES_WRITE)),
):
    payload_data = InitializeCheckout(**payload.model_dump(), cashier_id=user.id)
    record_sale = await store_crud.initialize_checkout(db=db, payload=payload_data, current_user=user)
    await db.commit()
    await purge_cache_namespace(redis_client, namespace="sales")
    await record_audit(
        db,
        actor=user,
        action="sale.initialize",
        outcome="success",
        resource_type="sale",
        resource_id=record_sale.id,
        business_id=payload.business_id,
        meta={"item_count": len(payload.items or [])},
    )
    return record_sale


@router.get("/sales/{business_id}", response_model=ApiResponse[PaginatedData[SaleReadWithRelations]], status_code=status.HTTP_200_OK,)
@limiter.limit("100/minute")
@cache(expire=CACHE_TTL_SEC, namespace="sales", key_builder=universal_key_builder)
async def get_sales(
    request: Request,
    business_id: UUID,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.SALES_READ_OWN)),
    sale_id: Optional[UUID] = Query(
        None, description="Optional UUID to fetch a specific sale"
    ),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Records per page (Max 100)"),
    single_date: Optional[date] = Query(
        None, description="Exact date filter (YYYY-MM-DD)"
    ),
    start_date: Optional[datetime] = Query(
        None, description="ISO 8601 start timestamp filter"
    ),
    end_date: Optional[datetime] = Query(
        None, description="ISO 8601 end timestamp filter"
    ),
):
    """
    Retrieves sales for a business scoped by user role.
    Supports pagination, specific sale lookup, single-day, and date-range filtering.
    """
    try:
        # 1. Single Sale Lookup Route Logic
        if sale_id:
            sale = await store_crud.fetch_sale_by_id(
                db=db, business_id=business_id, sale_id=sale_id, user=user
            )
            items = [sale] if sale else []
            total = len(items)

            return ApiResponse(
                status=True,
                status_code=200,
                message="Sale retrieved successfully.",
                data=PaginatedData(
                    items=items,
                    meta=PaginationMeta(
                        total=total,
                        page=1,
                        page_size=page_size,
                        total_pages=1 if total > 0 else 0,
                    ),
                ),
            )

        # 2. Paginated Query Execution
        sales, total_count = await store_crud.fetch_sales(
            db=db,
            business_id=business_id,
            user=user,
            page=page,
            page_size=page_size,
            single_date=single_date,
            start_date=start_date,
            end_date=end_date,
        )

        total_pages = (
            (total_count + page_size - 1) // page_size if total_count > 0 else 0
        )

        return ApiResponse(
            status=True,
            status_code=200,
            message="Sales retrieved successfully.",
            data=PaginatedData(
                items=sales,
                meta=PaginationMeta(
                    total=total_count,
                    page=page,
                    page_size=page_size,
                    total_pages=total_pages,
                ),
            ),
        )

    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        ) from val_err


@router.post("/checkout")
async def checkout_sale(
    db: SessionDep,
    payload: FinalizeCheckoutIn,
    background_tasks: BackgroundTasks,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.SALES_WRITE)),
):
    """
    Finalizes the sale (payment + stock deduction) and returns immediately.
    Document (Receipt/Invoice) generation runs in the background.
    """
    sale = await store_crud.finalize_checkout(
        db=db,
        sale_id=payload.sale_id,
        payload=payload,
        background_tasks=background_tasks,
    )
    await purge_cache_namespace(redis_client, namespace="sales")
    await record_audit(
        db,
        actor=user,
        action="sale.checkout",
        outcome="success",
        resource_type="sale",
        resource_id=payload.sale_id,
        meta={
            "payment_method": str(payload.payment_method),
            "status": str(getattr(sale, "status", None)),
        },
    )
    return sale


@router.get("/receipts/{sale_id}", status_code=200, response_model=FinancialDocumentSnapshotSchema)
async def fetch_receipts(db: SessionDep, user: AuthUser, sale_id: UUID):
    """
    Fetches a list of receipts for a given business, with optional pagination.
    """
    receipt = await store_crud.get_financial_document_json(db=db, sale_id=sale_id)
    return receipt


@router.get("/analytics", response_model=ApiResponse[DashboardAnalyticsResponse])
@limiter.limit("5/minute")
@cache(expire=CACHE_TTL_SEC, namespace="analytics", key_builder=universal_key_builder)
async def get_dashboard_analytics(
    request: Request,
    business_id: UUID,
    db: SessionDep,
    period: AnalyticsPeriod = AnalyticsPeriod.DAYS_7,
):
    results = await store_crud.fetch_dashboard_analytics(
        db, business_id=business_id, period=period
    )

    return ApiResponse(
        status_code=200,
        status=True,
        message="dashboard retrieved succesfully",
        data=results
    )
