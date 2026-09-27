from types import SimpleNamespace
from app.services.dashboard_daily import contribution_from_sale


def test_contribution_products_services_discount_no_tax():
    sale = SimpleNamespace(
        subtotal=1000,
        total_amount=1200,  # would include tax — we ignore for profit
        tax_amount=160,
        discount_applied=50,
        discount=0,
        service_amount=[{"description": "Delivery", "amount": 100}],
        updated_at=None,
        created_at=None,
    )
    items = [
        SimpleNamespace(
            product_id="p1",
            sku="A",
            name="Item A",
            quantity=2,
            unit_price=300,
            subtotal=600,
            cost_price_at_sale=100,
        ),
        SimpleNamespace(
            product_id="p2",
            sku="B",
            name="Item B",
            quantity=1,
            unit_price=400,
            subtotal=400,
            cost_price_at_sale=None,  # missing cost
        ),
    ]
    payments = [
        SimpleNamespace(method="CASH", amount=500),
        SimpleNamespace(method="MPESA", amount=500),
    ]
    c = contribution_from_sale(sale, items, payments)
    assert c["product_sales"] == 1000
    assert c["cogs"] == 200  # only first line 100*2
    assert c["product_profit"] == 800
    assert c["service_revenue"] == 100
    assert c["discounts_granted"] == 50
    assert c["gross_profit"] == 850  # 800 + 100 - 50
    assert c["missing_cost_line_count"] == 1
    assert c["cash_collected"] == 500
    assert c["mpesa_collected"] == 500
    assert "tax" not in c
