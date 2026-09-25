"""Checkout total formula: goods → discount → tax on net → + services."""


def compute_total(
    goods: float,
    discount: float,
    tax_rate: float,
    services: float = 0.0,
) -> dict:
    """Mirror initialize_checkout + cart getFinancials."""
    if tax_rate > 1:
        tax_rate = tax_rate / 100.0
    discount = min(max(0.0, discount), goods)
    net = max(0.0, goods - discount)
    tax = round(net * tax_rate, 2)
    total = round(net + tax + services, 2)
    return {
        "goods_subtotal": goods,
        "discount": discount,
        "net_subtotal": net,
        "tax_amount": tax,
        "services": services,
        "total_amount": total,
    }


def test_discount_then_tax_matches_server_semantics():
    out = compute_total(goods=1000, discount=100, tax_rate=0.16, services=50)
    assert out["net_subtotal"] == 900
    assert out["tax_amount"] == 144.0
    assert out["total_amount"] == 1094.0


def test_no_discount_tax_on_full_goods():
    out = compute_total(goods=1000, discount=0, tax_rate=0.16, services=0)
    assert out["tax_amount"] == 160.0
    assert out["total_amount"] == 1160.0


def test_discount_capped_at_goods():
    out = compute_total(goods=100, discount=500, tax_rate=0.16, services=10)
    assert out["discount"] == 100
    assert out["net_subtotal"] == 0
    assert out["tax_amount"] == 0.0
    assert out["total_amount"] == 10.0


def test_tax_feature_disabled_means_zero_in_gate():
    """Document production gate: effective rate must be 0 while feature is off."""
    TAX_FEATURE_ENABLED = False
    rate = 0.16 if TAX_FEATURE_ENABLED else 0.0
    out = compute_total(goods=1000, discount=100, tax_rate=rate, services=50)
    assert out["tax_amount"] == 0.0
    assert out["total_amount"] == 950.0  # 900 net + 0 tax + 50 services
