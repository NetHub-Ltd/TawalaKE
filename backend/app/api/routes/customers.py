"""Customer workspace API — list, detail, create, update, soft-delete."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import SessionDep, get_redis, AsyncRedis
from app.api.rbac_deps import require_permissions, assert_business_access
from app.core.rbac import Permission
from app.crud.customer import customer_crud
from app.models.models import Staff
from app.schemas.customer import (
    CustomerCreate,
    CustomerDetailResponse,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdate,
)
from app.schemas.schemas import ApiResponse

router = APIRouter()


@router.get(
    "/{business_id}",
    response_model=ApiResponse[CustomerListResponse],
)
async def list_customers(
    business_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.SALES_READ_BUSINESS)),
    q: Optional[str] = Query(None, description="Search name, phone, email"),
    has_open_credit: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    await assert_business_access(db, user, business_id, redis_client)
    items, total = await customer_crud.list_customers(
        db,
        business_id=business_id,
        q=q,
        has_open_credit=has_open_credit,
        skip=skip,
        limit=limit,
    )
    return ApiResponse(
        status=True,
        status_code=200,
        message="customers retrieved",
        data=CustomerListResponse(items=items, total=total),
    )


@router.get(
    "/{business_id}/{customer_id}",
    response_model=ApiResponse[CustomerDetailResponse],
)
async def get_customer(
    business_id: UUID,
    customer_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.SALES_READ_BUSINESS)),
):
    await assert_business_access(db, user, business_id, redis_client)
    detail = await customer_crud.get_detail(
        db, customer_id=customer_id, business_id=business_id
    )
    return ApiResponse(
        status=True,
        status_code=200,
        message="customer retrieved",
        data=detail,
    )


@router.post(
    "",
    response_model=ApiResponse[CustomerResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_customer(
    payload: CustomerCreate,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.SALES_WRITE)),
):
    await assert_business_access(db, user, payload.business_id, redis_client)
    obj = await customer_crud.create(
        db, payload=payload, organization_id=user.organization_id
    )
    data = await customer_crud.to_response(db, obj)
    return ApiResponse(
        status=True,
        status_code=201,
        message="customer created",
        data=data,
    )


@router.patch(
    "/{business_id}/{customer_id}",
    response_model=ApiResponse[CustomerResponse],
)
async def update_customer(
    business_id: UUID,
    customer_id: UUID,
    payload: CustomerUpdate,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.SALES_WRITE)),
):
    await assert_business_access(db, user, business_id, redis_client)
    obj = await customer_crud.update(
        db, customer_id=customer_id, business_id=business_id, payload=payload
    )
    data = await customer_crud.to_response(db, obj)
    return ApiResponse(
        status=True,
        status_code=200,
        message="customer updated",
        data=data,
    )


@router.delete(
    "/{business_id}/{customer_id}",
    response_model=ApiResponse[None],
)
async def delete_customer(
    business_id: UUID,
    customer_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.SALES_WRITE)),
):
    await assert_business_access(db, user, business_id, redis_client)
    await customer_crud.soft_delete(
        db, customer_id=customer_id, business_id=business_id
    )
    return ApiResponse(
        status=True,
        status_code=200,
        message="customer deleted",
        data=None,
    )
