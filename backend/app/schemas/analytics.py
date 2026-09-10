from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional

from app.utils.helpers import AnalyticsPeriod


class AnalyticsWindow(BaseModel):
    start: datetime
    end: datetime


class AnalyticsSummaryBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")

    gross_sales_volume: float = 0
    total_tax_collected: float = 0
    total_discounts_granted: float = 0
    net_revenue_collected: float = 0
    refund_deductions_volume: float = 0
    total_completed_orders_count: int = 0
    average_order_value: float = 0
    cogs_volume: float = 0
    gross_profit: float = 0
    cash_volume: float = 0
    mpesa_volume: float = 0
    card_volume: float = 0
    other_volume: float = 0
    missing_cost_line_count: int = 0
    profit_is_provisional: bool = False
    credit_outstanding: float = 0
    open_credit_sales: int = 0
    credit_scope: Optional[str] = None
    credit_issued_period: float = 0
    credit_issued_count: int = 0
    credit_collected_period: float = 0
    credit_collected_count: int = 0
    expenses_total: float = 0
    expenses_count: int = 0
    profit_after_expenses: float = 0
    expenses_available: bool = True
    expenses_by_category: list = Field(default_factory=list)


class AnalyticsSeriesPoint(BaseModel):
    model_config = ConfigDict(extra="ignore")

    date: date
    date_dimension: datetime
    gross_sales_volume: float = 0
    total_tax_collected: float = 0
    total_discounts_granted: float = 0
    net_revenue_collected: float = 0
    refund_deductions_volume: float = 0
    total_completed_orders_count: int = 0
    cash_volume: float = 0
    mpesa_volume: float = 0
    card_volume: float = 0
    other_volume: float = 0
    gross_profit: float = 0
    cogs_volume: float = 0
    missing_cost_line_count: int = 0


class DashboardAnalyticsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    period: AnalyticsPeriod
    window: AnalyticsWindow
    previous_window: AnalyticsWindow
    summary: AnalyticsSummaryBlock
    previous_summary: AnalyticsSummaryBlock
    series: list[AnalyticsSeriesPoint] = Field(default_factory=list)
