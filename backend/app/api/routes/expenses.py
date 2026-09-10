"""Expense tracker API — gated by plan feature expense_tracking."""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import SessionDep, get_redis, AsyncRedis
from app.api.rbac_deps import require_permissions, assert_business_access
from app.core.rbac import Permission
from app.crud.expense import expense_crud
from app.models.models import ExpenseCategory, Staff
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseListResponse,
    ExpensePeriodSummary,
    ExpenseResponse,
    ExpenseUpdate,
)
from app.schemas.schemas import ApiResponse

router = APIRouter()


def _parse_day(value: Optional[str], *, end: bool = False) -> Optional[datetime]:
    if not value:
        return None
    try:
        if len(value) <= 10:
            d = date.fromisoformat(value)
            if end:
                # exclusive end = next day 00:00
                from datetime import timedelta
                return datetime(d.year, d.month, d.day, tzinfo=timezone.utc) + timedelta(days=1)
            return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Invalid date: {value}") from e


@router.post("", response_model=ApiResponse[ExpenseResponse], status_code=201)
async def create_expense(
    payload: ExpenseCreate,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
):
    """Record a business operating expense."""
    await assert_business_access(db, user, payload.business_id, redis_client)
    obj = await expense_crud.create_expense(
        db,
        payload=payload,
        organization_id=user.organization_id,
        recorded_by=user.id,
    )
    return ApiResponse(
        status=True,
        status_code=201,
        message="expense recorded",
        data=ExpenseResponse.model_validate(obj),
    )


@router.get("/{business_id}", response_model=ApiResponse[ExpenseListResponse])
async def list_expenses(
    business_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
    start: Optional[str] = None,
    end: Optional[str] = None,
    category: Optional[ExpenseCategory] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    await assert_business_access(db, user, business_id, redis_client)
    items, total, total_amount = await expense_crud.list_expenses(
        db,
        business_id=business_id,
        start=_parse_day(start),
        end=_parse_day(end, end=True),
        category=category,
        skip=skip,
        limit=limit,
    )
    return ApiResponse(
        status=True,
        status_code=200,
        message="ok",
        data=ExpenseListResponse(
            items=[ExpenseResponse.model_validate(i) for i in items],
            total=total,
            total_amount=total_amount,
        ),
    )


@router.get(
    "/{business_id}/summary",
    response_model=ApiResponse[ExpensePeriodSummary],
)
async def expense_summary(
    business_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD exclusive end day or inclusive date"),
):
    await assert_business_access(db, user, business_id, redis_client)
    s = _parse_day(start)
    e = _parse_day(end, end=True)
    if not s or not e:
        raise HTTPException(status_code=422, detail="start and end required")
    data = await expense_crud.period_summary(
        db, business_id=business_id, start=s, end=e
    )
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.patch("/{business_id}/{expense_id}", response_model=ApiResponse[ExpenseResponse])
async def update_expense(
    business_id: UUID,
    expense_id: UUID,
    payload: ExpenseUpdate,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
):
    await assert_business_access(db, user, business_id, redis_client)
    obj = await expense_crud.update_expense(
        db, expense_id=expense_id, business_id=business_id, payload=payload
    )
    return ApiResponse(
        status=True,
        status_code=200,
        message="updated",
        data=ExpenseResponse.model_validate(obj),
    )


@router.delete("/{business_id}/{expense_id}", status_code=204)
async def delete_expense(
    business_id: UUID,
    expense_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
):
    await assert_business_access(db, user, business_id, redis_client)
    await expense_crud.soft_delete_expense(
        db, expense_id=expense_id, business_id=business_id, actor_id=user.id
    )
    return None
