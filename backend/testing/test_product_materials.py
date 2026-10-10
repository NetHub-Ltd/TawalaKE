"""Unit tests for catalog service kind + material recipe helpers."""
from app.crud.product_materials import _normalize_item_type
from app.models.models import ItemType


def test_normalize_item_type_defaults_product():
    assert _normalize_item_type(None) == ItemType.PRODUCT
    assert _normalize_item_type("") == ItemType.PRODUCT
    assert _normalize_item_type("product") == ItemType.PRODUCT
    assert _normalize_item_type("PRODUCT") == ItemType.PRODUCT


def test_normalize_item_type_service():
    assert _normalize_item_type("SERVICE") == ItemType.SERVICE
    assert _normalize_item_type("service") == ItemType.SERVICE
    assert _normalize_item_type("Services") == ItemType.SERVICE
