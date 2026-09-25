"""Receipt snapshot service line normalization / enrich helpers."""
from app.crud.store import StoreCrud


def test_normalize_service_lines_array():
    lines = StoreCrud._normalize_service_lines(
        [{"description": "Delivery", "amount": 200}, {"description": "", "amount": 50}]
    )
    assert lines == [{"description": "Delivery", "amount": 200.0}]


def test_normalize_service_lines_legacy_object():
    lines = StoreCrud._normalize_service_lines(
        {"description": "Design", "amount": 150.5}
    )
    assert lines == [{"description": "Design", "amount": 150.5}]


def test_normalize_service_lines_empty():
    assert StoreCrud._normalize_service_lines(None) == []
    assert StoreCrud._normalize_service_lines([]) == []
