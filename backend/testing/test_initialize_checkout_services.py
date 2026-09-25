"""InitializeCheckout must accept discount + services (terminal total integrity)."""
from uuid import uuid4

from app.schemas.store import InitializeCheckout, InitializeCheckoutRequest, ServiceFee


def test_initialize_request_accepts_services_and_discount():
    bid = uuid4()
    body = InitializeCheckoutRequest(
        business_id=bid,
        items=[],
        discount=50.0,
        services=[
            ServiceFee(amount=200, description="Delivery"),
            ServiceFee(amount=100.5, description="Design"),
        ],
    )
    assert body.discount == 50.0
    assert len(body.services) == 2
    assert body.services[0].amount == 200
    assert body.services[0].description == "Delivery"


def test_initialize_checkout_internal_carries_services():
    bid = uuid4()
    cid = uuid4()
    payload = InitializeCheckout(
        business_id=bid,
        cashier_id=cid,
        items=[],
        discount=10,
        services=[ServiceFee(amount=75, description="Service charge")],
    )
    assert payload.discount == 10
    assert payload.services[0].amount == 75


def test_extra_fields_not_required_for_legacy_clients():
    """Older clients that only send business_id + items still validate."""
    bid = uuid4()
    body = InitializeCheckoutRequest(business_id=bid, items=[])
    assert body.discount == 0.0
    assert body.services == []
