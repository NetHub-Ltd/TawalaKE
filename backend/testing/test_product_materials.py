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


class _FakeRow:
    """Minimal stand-in for SQLAlchemy Row (not a tuple subclass)."""

    def __init__(self, *items):
        self._items = items

    def __getitem__(self, i):
        return self._items[i]

    def __len__(self):
        return len(self._items)


def test_unpack_material_row_tuple_and_row():
    from app.crud.product_materials import _unpack_material_row
    from app.models.models import ProductMaterial, Product
    from uuid import uuid4

    pm = ProductMaterial(
        id=uuid4(),
        business_id=uuid4(),
        service_id=uuid4(),
        material_id=uuid4(),
        quantity=2.0,
    )
    prod = Product(
        id=pm.material_id,
        business_id=pm.business_id,
        label="Paper A4",
        selling_price=10.0,
        track_stock=True,
        stock=5.0,
        category="General",
        attributes={},
    )
    b1, m1 = _unpack_material_row((pm, prod))
    assert b1 is pm and m1 is prod
    b2, m2 = _unpack_material_row(_FakeRow(pm, prod))
    assert b2 is pm and m2 is prod
    b3, m3 = _unpack_material_row(pm)
    assert b3 is pm and m3 is None
