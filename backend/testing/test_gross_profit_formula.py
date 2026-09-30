"""Gross profit must exclude tax from margin base."""


def gross_profit(*, total_amount: float, tax_amount: float, cogs: float) -> float:
    """Matches analytics_rollup: revenue_ex_tax - COGS."""
    revenue_ex_tax = max(0.0, float(total_amount or 0) - float(tax_amount or 0))
    return revenue_ex_tax - float(cogs or 0)


def test_profit_excludes_tax():
    # total 116 includes 16 tax; COGS 50 → profit should be 50 not 66
    assert gross_profit(total_amount=116.0, tax_amount=16.0, cogs=50.0) == 50.0


def test_profit_with_zero_tax():
    assert gross_profit(total_amount=100.0, tax_amount=0.0, cogs=40.0) == 60.0


def test_profit_missing_cost_treated_as_zero_cogs():
    assert gross_profit(total_amount=100.0, tax_amount=0.0, cogs=0.0) == 100.0
