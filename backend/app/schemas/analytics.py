from pydantic import BaseModel, Field
from datetime import datetime
from datetime import date, datetime
from app.utils.helpers import AnalyticsPeriod

class AnalyticsWindow(BaseModel):
    start: datetime
    end: datetime

class AnalyticsSummaryBlock(BaseModel):
    gross_sales_volume: float = 0
    total_tax_collected: float = 0
    total_discounts_granted: float = 0
    net_revenue_collected: float = 0
    refund_deductions_volume: float = 0
    total_completed_orders_count: int = 0
    average_order_value: float = 0

class AnalyticsSeriesPoint(BaseModel):
    date: date
    date_dimension: datetime
    gross_sales_volume: float = 0
    total_tax_collected: float = 0
    total_discounts_granted: float = 0
    net_revenue_collected: float = 0
    refund_deductions_volume: float = 0
    total_completed_orders_count: int = 0

class DashboardAnalyticsResponse(BaseModel):
    period: AnalyticsPeriod
    window: AnalyticsWindow
    previous_window: AnalyticsWindow
    summary: AnalyticsSummaryBlock
    previous_summary: AnalyticsSummaryBlock
    series: list[AnalyticsSeriesPoint] = Field(default_factory=list)