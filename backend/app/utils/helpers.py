import re
from datetime import datetime, timezone
from typing import Optional
from fastapi import Request
from app.utils.logging import logger


def utc_now() -> datetime:
    """Return current UTC time as a timezone-aware datetime."""
    return datetime.now(timezone.utc)


def utc_today() -> datetime:
    """Return today's date in UTC (00:00:00)."""
    now = utc_now()
    return datetime(year=now.year, month=now.month, day=now.day, tzinfo=timezone.utc)


def validate_and_format_kenyan_phone(phone: str, format: bool = False) -> Optional[str]:
    """
    Validates a Kenyan phone number (07xx or 01xx, 10 digits total).
    Accepts local format (07... / 01...) and international (+254... / 254...).

    Args:
        phone: The phone number string
        format: If True → returns international format (+2547xx...) if valid
                If False → returns the original cleaned string if valid

    Returns:
        str: formatted/validated phone number if valid
        None: if invalid
    """
    if not phone:
        return None

    # Remove whitespace, dashes, parentheses, etc.
    cleaned = re.sub(r"[\s\-\_\(\)]", "", phone.strip())

    # Pattern: optional +254 / 0 prefix + exactly 9 digits starting with 7 or 1
    pattern = r"^(\+254|0)?(7[0-9]{8}|1[0-9]{8})$"

    match = re.match(pattern, cleaned)
    if not match:
        return None

    # The actual 9-digit part (after prefix)
    digits = match.group(2)

    if format:
        # Return international format
        return f"254{digits}"
    else:
        # Return cleaned local format (with 0 prefix)
        return f"0{digits}"

from datetime import datetime, timedelta, timezone
from enum import Enum

class AnalyticsPeriod(str, Enum):
    """Supported dashboard analytics windows."""

    TODAY = "today"
    YESTERDAY = "yesterday"
    DAYS_3 = "3d"
    DAYS_7 = "7d"
    MONTH = "month"


def period_windows(
    period: AnalyticsPeriod,
    now: datetime | None = None,
) -> tuple[datetime, datetime, datetime, datetime]:
    """
    Build current and previous half-open windows [start, end) in UTC.

    Returns:
        (current_start, current_end, previous_start, previous_end)

    Comparison rule:
        - today      → vs yesterday
        - yesterday  → vs the day before yesterday
        - 3d / 7d    → vs the immediately preceding equal-length window
        - month      → vs previous calendar month
    """
    now = now or datetime.now(timezone.utc)

    # End of "today" bucket = tomorrow 00:00 UTC
    current_end = datetime(now.year, now.month, now.day, tzinfo=timezone.utc) + timedelta(
        days=1
    )
    start_of_today = current_end - timedelta(days=1)

    if period == AnalyticsPeriod.TODAY:
        # Today vs yesterday
        current_start = start_of_today
        previous_start = start_of_today - timedelta(days=1)
        previous_end = start_of_today

    elif period == AnalyticsPeriod.YESTERDAY:
        # Yesterday vs day-before-yesterday
        current_start = start_of_today - timedelta(days=1)
        current_end = start_of_today
        previous_start = current_start - timedelta(days=1)
        previous_end = current_start

    elif period == AnalyticsPeriod.DAYS_3:
        # Last 3 calendar days (including today) vs the 3 days before that
        current_start = start_of_today - timedelta(days=2)
        previous_end = current_start
        previous_start = previous_end - timedelta(days=3)

    elif period == AnalyticsPeriod.DAYS_7:
        # Last 7 calendar days (including today) vs the prior 7 days
        current_start = start_of_today - timedelta(days=6)
        previous_end = current_start
        previous_start = previous_end - timedelta(days=7)

    elif period == AnalyticsPeriod.MONTH:
        # This calendar month vs previous calendar month
        current_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        if now.month == 1:
            previous_start = datetime(now.year - 1, 12, 1, tzinfo=timezone.utc)
            previous_end = datetime(now.year, 1, 1, tzinfo=timezone.utc)
        else:
            previous_start = datetime(now.year, now.month - 1, 1, tzinfo=timezone.utc)
            previous_end = current_start

    else:
        # Safe fallback: same as 7d
        current_start = start_of_today - timedelta(days=6)
        previous_end = current_start
        previous_start = previous_end - timedelta(days=7)

    return current_start, current_end, previous_start, previous_end


def aggregate_rows(rows) -> dict:
    gross = sum(r.gross_sales_volume for r in rows)
    tax = sum(r.total_tax_collected for r in rows)
    discounts = sum(r.total_discounts_granted for r in rows)
    revenue = sum(r.net_revenue_collected for r in rows)
    refunds = sum(r.refund_deductions_volume for r in rows)
    orders = sum(r.total_completed_orders_count for r in rows)

    return {
        "gross_sales_volume": gross,
        "total_tax_collected": tax,
        "total_discounts_granted": discounts,
        "net_revenue_collected": revenue,
        "refund_deductions_volume": refunds,
        "total_completed_orders_count": orders,
        "average_order_value": (revenue / orders) if orders else 0.0,
    }

    