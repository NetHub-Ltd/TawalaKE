"""Pre-aggregated reporting API — dashboard, series, products, staff, insights, backfill."""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import SessionDep, get_redis, AsyncRedis
from app.api.rbac_deps import require_permissions, assert_business_access
from app.core.rbac import Permission
from app.crud.reporting import reporting_crud
from app.models.models import Staff
from app.schemas.reporting import (
    BackfillResponse,
    FullReportResponse,
    HourlyResponse,
    InsightsResponse,
    OverviewResponse,
    ProductsResponse,
    SeriesResponse,
    StaffResponse,
)
from app.schemas.schemas import ApiResponse
from app.schemas.analytics import DashboardAnalyticsResponse
from app.services.analytics_rollup import backfill_business_rollups
from app.utils.helpers import AnalyticsPeriod

router = APIRouter()


def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        # date-only
        if len(value) <= 10:
            d = date.fromisoformat(value)
            return datetime(d.year, d.month, d.day)
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid datetime: {value}",
        ) from e




@router.get(
    "/{business_id}/dashboard",
    response_model=ApiResponse[DashboardAnalyticsResponse],
)
async def report_dashboard(
    business_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
    period: AnalyticsPeriod = AnalyticsPeriod.DAYS_7,
):
    """
    Primary dashboard payload (compat with legacy /business/analytics).
    Served only from pre-aggregated rollups.
    """
    await assert_business_access(db, user, business_id, redis_client)
    data = await reporting_crud.dashboard(db, business_id=business_id, period=period)
    return ApiResponse(status=True, status_code=200, message="dashboard retrieved successfully", data=data)

@router.get(
    "/{business_id}/overview",
    response_model=ApiResponse[OverviewResponse],
)
async def report_overview(
    business_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
    period: AnalyticsPeriod = AnalyticsPeriod.DAYS_7,
    date_value: Optional[date] = Query(None, alias="date"),
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    await assert_business_access(db, user, business_id, redis_client)
    try:
        data = await reporting_crud.overview(
            db,
            business_id=business_id,
            period=period,
            date_value=date_value,
            start=_parse_dt(start),
            end=_parse_dt(end),
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.get(
    "/{business_id}/series",
    response_model=ApiResponse[SeriesResponse],
)
async def report_series(
    business_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
    period: AnalyticsPeriod = AnalyticsPeriod.DAYS_7,
    date_value: Optional[date] = Query(None, alias="date"),
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    await assert_business_access(db, user, business_id, redis_client)
    data = await reporting_crud.series(
        db,
        business_id=business_id,
        period=period,
        date_value=date_value,
        start=_parse_dt(start),
        end=_parse_dt(end),
    )
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.get(
    "/{business_id}/hourly",
    response_model=ApiResponse[HourlyResponse],
)
async def report_hourly(
    business_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    await assert_business_access(db, user, business_id, redis_client)
    data = await reporting_crud.hourly(
        db,
        business_id=business_id,
        start=_parse_dt(start),
        end=_parse_dt(end),
    )
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.get(
    "/{business_id}/products",
    response_model=ApiResponse[ProductsResponse],
)
async def report_products(
    business_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
    period: AnalyticsPeriod = AnalyticsPeriod.DAYS_7,
    date_value: Optional[date] = Query(None, alias="date"),
    start: Optional[str] = None,
    end: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    order_by: str = Query("revenue"),
):
    await assert_business_access(db, user, business_id, redis_client)
    data = await reporting_crud.products(
        db,
        business_id=business_id,
        period=period,
        date_value=date_value,
        start=_parse_dt(start),
        end=_parse_dt(end),
        limit=limit,
        order_by=order_by,
    )
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.get(
    "/{business_id}/staff",
    response_model=ApiResponse[StaffResponse],
)
async def report_staff(
    business_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
    period: AnalyticsPeriod = AnalyticsPeriod.DAYS_7,
    date_value: Optional[date] = Query(None, alias="date"),
    start: Optional[str] = None,
    end: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
):
    await assert_business_access(db, user, business_id, redis_client)
    data = await reporting_crud.staff(
        db,
        business_id=business_id,
        period=period,
        date_value=date_value,
        start=_parse_dt(start),
        end=_parse_dt(end),
        limit=limit,
    )
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.get(
    "/{business_id}/insights",
    response_model=ApiResponse[InsightsResponse],
)
async def report_insights(
    business_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
    period: AnalyticsPeriod = AnalyticsPeriod.DAYS_7,
    date_value: Optional[date] = Query(None, alias="date"),
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    await assert_business_access(db, user, business_id, redis_client)
    data = await reporting_crud.insights(
        db,
        business_id=business_id,
        period=period,
        date_value=date_value,
        start=_parse_dt(start),
        end=_parse_dt(end),
    )
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.get(
    "/{business_id}/full",
    response_model=ApiResponse[FullReportResponse],
)
async def report_full(
    business_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
    period: AnalyticsPeriod = AnalyticsPeriod.MONTH,
    date_value: Optional[date] = Query(None, alias="date"),
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    await assert_business_access(db, user, business_id, redis_client)
    kwargs = dict(
        business_id=business_id,
        period=period,
        date_value=date_value,
        start=_parse_dt(start),
        end=_parse_dt(end),
    )
    overview = await reporting_crud.overview(db, **kwargs)
    series = await reporting_crud.series(db, **kwargs)
    products = await reporting_crud.products(db, **kwargs, limit=20)
    staff = await reporting_crud.staff(db, **kwargs)
    insights = await reporting_crud.insights(db, **kwargs)
    hourly = await reporting_crud.hourly(
        db,
        business_id=business_id,
        start=overview.window.start,
        end=overview.window.end,
    )
    data = FullReportResponse(
        overview=overview,
        series=series,
        hourly=hourly,
        products=products,
        staff=staff,
        insights=insights,
    )
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.post(
    "/{business_id}/backfill",
    response_model=ApiResponse[BackfillResponse],
)
async def report_backfill(
    business_id: UUID,
    db: SessionDep,
    redis_client: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.REPORTS_READ)),
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Rebuild rollups from COMPLETED sales (required after deploy / schema change)."""
    await assert_business_access(db, user, business_id, redis_client)
    result = await backfill_business_rollups(
        db,
        business_id=business_id,
        start=_parse_dt(start),
        end=_parse_dt(end),
    )
    return ApiResponse(
        status=True,
        status_code=200,
        message="backfill complete",
        data=BackfillResponse(**result),
    )
