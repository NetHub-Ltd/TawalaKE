"""Response schemas for pre-aggregated reporting APIs."""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.utils.helpers import AnalyticsPeriod


class ReportWindow(BaseModel):
    start: datetime
    end: datetime


class OverviewMetrics(BaseModel):
    orders: int = 0
    gross_sales: float = 0
    discounts: float = 0
    tax: float = 0
    net_revenue: float = 0
    cogs: float = 0
    gross_profit: float = 0
    gross_margin_pct: float = 0
    average_order_value: float = 0
    refunds: float = 0


class OverviewResponse(BaseModel):
    period: AnalyticsPeriod
    window: ReportWindow
    previous_window: Optional[ReportWindow] = None
    current: OverviewMetrics
    previous: Optional[OverviewMetrics] = None
    deltas: dict = Field(default_factory=dict)


class SeriesPoint(BaseModel):
    date: date
    date_dimension: datetime
    gross_sales: float = 0
    net_revenue: float = 0
    cogs: float = 0
    gross_profit: float = 0
    orders: int = 0
    discounts: float = 0


class SeriesResponse(BaseModel):
    period: AnalyticsPeriod
    window: ReportWindow
    series: List[SeriesPoint] = Field(default_factory=list)


class HourlyPoint(BaseModel):
    hour: datetime
    net_revenue: float = 0
    gross_profit: float = 0
    orders: int = 0


class HourlyResponse(BaseModel):
    window: ReportWindow
    series: List[HourlyPoint] = Field(default_factory=list)


class ProductRow(BaseModel):
    product_id: str
    sku: str = ""
    name: str = ""
    quantity_sold: float = 0
    revenue: float = 0
    cogs: float = 0
    gross_profit: float = 0
    margin_pct: float = 0


class ProductsResponse(BaseModel):
    window: ReportWindow
    items: List[ProductRow] = Field(default_factory=list)


class StaffRow(BaseModel):
    staff_id: str
    full_name: str = ""
    orders: int = 0
    revenue: float = 0
    cogs: float = 0
    gross_profit: float = 0
    avg_ticket: float = 0
    revenue_share_pct: float = 0


class StaffResponse(BaseModel):
    window: ReportWindow
    items: List[StaffRow] = Field(default_factory=list)


class InsightCard(BaseModel):
    code: str
    severity: str  # info | warning | critical
    title: str
    detail: str
    metric: Optional[float] = None


class InsightsResponse(BaseModel):
    window: ReportWindow
    insights: List[InsightCard] = Field(default_factory=list)


class FullReportResponse(BaseModel):
    overview: OverviewResponse
    series: SeriesResponse
    hourly: HourlyResponse
    products: ProductsResponse
    staff: StaffResponse
    insights: InsightsResponse


class BackfillResponse(BaseModel):
    business_id: str
    sales_scanned: int
    sales_applied: int
