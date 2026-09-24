"""Catalog HTTP surface — units of measure and product categories."""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.api.deps import SessionDep
from app.api.rbac_deps import require_permissions
from app.core.rbac import Permission
from app.crud import catalog as catalog_crud
from app.models.models import Staff
from app.schemas.schemas import (
    ApiResponse,
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    UnitOfMeasureCreate,
    UnitOfMeasureResponse,
    UnitOfMeasureUpdate,
)

router = APIRouter()


class UnitListResponse(BaseModel):
    status: bool = True
    status_code: int = 200
    message: str = "ok"
    data: List[UnitOfMeasureResponse]


class CategoryListResponse(BaseModel):
    status: bool = True
    status_code: int = 200
    message: str = "ok"
    data: List[CategoryResponse]


@router.get("/units", response_model=UnitListResponse)
async def list_units_of_measure(
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.CATALOG_READ)),
    active_only: bool = Query(True),
):
    await catalog_crud.ensure_system_units(db)
    rows = await catalog_crud.list_units(
        db, organization_id=user.organization_id, active_only=active_only
    )
    data = [UnitOfMeasureResponse.model_validate(r) for r in rows]
    return UnitListResponse(data=data)


@router.post("/units", response_model=ApiResponse[UnitOfMeasureResponse])
async def create_unit_of_measure(
    payload: UnitOfMeasureCreate,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.CATALOG_WRITE)),
):
    row = await catalog_crud.create_unit(
        db, payload, organization_id=user.organization_id
    )
    return ApiResponse(
        status=True,
        status_code=201,
        message="Unit created",
        data=UnitOfMeasureResponse.model_validate(row),
    )


@router.patch("/units/{unit_id}", response_model=ApiResponse[UnitOfMeasureResponse])
async def update_unit_of_measure(
    unit_id: UUID,
    payload: UnitOfMeasureUpdate,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.CATALOG_WRITE)),
):
    row = await catalog_crud.update_unit(db, unit_id, payload)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Unit updated",
        data=UnitOfMeasureResponse.model_validate(row),
    )


@router.get("/categories", response_model=CategoryListResponse)
async def list_product_categories(
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.CATALOG_READ)),
    business_id: Optional[UUID] = Query(None),
    active_only: bool = Query(True),
):
    if not user.organization_id:
        from fastapi import HTTPException

        raise HTTPException(400, detail="No organization on account")
    rows = await catalog_crud.list_categories(
        db,
        organization_id=user.organization_id,
        business_id=business_id,
        active_only=active_only,
    )
    data = [CategoryResponse.model_validate(r) for r in rows]
    return CategoryListResponse(data=data)


@router.post("/categories", response_model=ApiResponse[CategoryResponse])
async def create_product_category(
    payload: CategoryCreate,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.CATALOG_WRITE)),
):
    if not user.organization_id:
        from fastapi import HTTPException

        raise HTTPException(400, detail="No organization on account")
    row = await catalog_crud.create_category(db, user.organization_id, payload)
    return ApiResponse(
        status=True,
        status_code=201,
        message="Category created",
        data=CategoryResponse.model_validate(row),
    )


@router.patch("/categories/{category_id}", response_model=ApiResponse[CategoryResponse])
async def update_product_category(
    category_id: UUID,
    payload: CategoryUpdate,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.CATALOG_WRITE)),
):
    if not user.organization_id:
        from fastapi import HTTPException

        raise HTTPException(400, detail="No organization on account")
    row = await catalog_crud.update_category(
        db, user.organization_id, category_id, payload
    )
    return ApiResponse(
        status=True,
        status_code=200,
        message="Category updated",
        data=CategoryResponse.model_validate(row),
    )
