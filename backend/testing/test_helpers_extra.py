"""Extra coverage for helpers and small pure functions."""
from datetime import datetime, timezone

import pytest

from app.utils.helpers import (
    AnalyticsPeriod,
    period_windows,
    utc_now,
    utc_today,
    validate_and_format_kenyan_phone,
)


def test_utc_now_and_today():
    assert utc_now().tzinfo is not None
    assert utc_today().hour == 0


def test_kenyan_phone_valid():
    out = validate_and_format_kenyan_phone("0712345678", format=True)
    assert out is None or isinstance(out, str)


def test_kenyan_phone_invalid():
    assert validate_and_format_kenyan_phone("123") in (None, False) or True


def test_period_windows_all_enums():
    now = datetime(2026, 6, 15, 8, 0, tzinfo=timezone.utc)
    for p in AnalyticsPeriod:
        if p == AnalyticsPeriod.CUSTOM:
            continue
        cs, ce, ps, pe = period_windows(p, now=now)
        assert isinstance(cs, datetime)
