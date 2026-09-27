"""Unit tests for Business.config.financial_documents helpers."""

from app.core.financial_docs_config import (
    DEFAULT_LOGO_URL,
    DEFAULT_PAPER_SIZE,
    DEFAULT_TERMS,
    MAX_PAYMENT_FIELDS,
    default_financial_documents,
    get_financial_documents_from_business_config,
    merge_business_config,
    normalize_financial_documents,
)


def test_default_financial_documents_shape():
    d = default_financial_documents()
    assert d["logo_url"] == DEFAULT_LOGO_URL
    assert d["display_name"] is None
    assert d["payment_fields"] == []
    assert d["terms_and_conditions"] == DEFAULT_TERMS
    assert d["paper_size"] == DEFAULT_PAPER_SIZE
    assert d["apply_to_existing"] is False
    # fresh dict each call
    assert default_financial_documents() is not d


def test_normalize_non_dict_returns_defaults():
    assert normalize_financial_documents(None)["logo_url"] == DEFAULT_LOGO_URL
    assert normalize_financial_documents("x")["paper_size"] == "A5"
    assert normalize_financial_documents([])["payment_fields"] == []


def test_normalize_logo_and_display_name():
    out = normalize_financial_documents(
        {
            "logo_url": "  https://example.com/logo.png  ",
            "display_name": "  My Shop  ",
        }
    )
    assert out["logo_url"] == "https://example.com/logo.png"
    assert out["display_name"] == "My Shop"

    empty_logo = normalize_financial_documents({"logo_url": ""})
    assert empty_logo["logo_url"] == DEFAULT_LOGO_URL

    none_display = normalize_financial_documents({"display_name": "   "})
    assert none_display["display_name"] is None


def test_normalize_logo_truncation():
    long_url = "https://x.test/" + ("a" * 3000)
    out = normalize_financial_documents({"logo_url": long_url})
    assert len(out["logo_url"]) == 2048


def test_normalize_terms_and_paper():
    out = normalize_financial_documents(
        {
            "terms_and_conditions": "  Pay now.  ",
            "paper_size": "a4",
        }
    )
    assert out["terms_and_conditions"] == "Pay now."
    assert out["paper_size"] == "A4"

    bad_paper = normalize_financial_documents({"paper_size": "letter"})
    assert bad_paper["paper_size"] == DEFAULT_PAPER_SIZE

    empty_terms = normalize_financial_documents({"terms_and_conditions": "  "})
    assert empty_terms["terms_and_conditions"] == DEFAULT_TERMS


def test_normalize_payment_fields_max_three():
    raw = {
        "payment_fields": [
            {"label": "Bank", "value": "ABC"},
            {"label": "Acc", "value": "123"},
            {"label": "Till", "value": "999"},
            {"label": "Extra", "value": "ignored"},
            "not-a-dict",
            {"label": "", "value": ""},  # empty skipped if both empty - but only first 3 iterated
        ]
    }
    out = normalize_financial_documents(raw)
    assert len(out["payment_fields"]) == MAX_PAYMENT_FIELDS
    assert out["payment_fields"][0] == {"label": "Bank", "value": "ABC"}
    assert out["payment_fields"][2]["label"] == "Till"


def test_normalize_payment_field_label_default():
    out = normalize_financial_documents(
        {"payment_fields": [{"label": "", "value": "only-value"}]}
    )
    assert out["payment_fields"] == [{"label": "Detail", "value": "only-value"}]


def test_get_from_business_config():
    cfg = {
        "receipt_footer": "Thanks",
        "financial_documents": {
            "logo_url": "https://cdn/x.svg",
            "paper_size": "A5",
            "payment_fields": [{"label": "M-Pesa", "value": "0700"}],
        },
    }
    fd = get_financial_documents_from_business_config(cfg)
    assert fd["logo_url"] == "https://cdn/x.svg"
    assert fd["payment_fields"][0]["label"] == "M-Pesa"

    assert get_financial_documents_from_business_config(None)["logo_url"] == DEFAULT_LOGO_URL
    assert get_financial_documents_from_business_config({})["paper_size"] == "A5"


def test_merge_business_config_with_extra_and_fd():
    existing = {"receipt_footer": "Hi", "show_tax_on_receipt": True}
    merged = merge_business_config(
        existing,
        financial_documents={
            "display_name": "Corner Shop",
            "payment_fields": [{"label": "Bank", "value": "KE"}],
        },
        extra={"receipt_footer": "Bye", "financial_documents": {"ignored": True}},
    )
    assert merged["receipt_footer"] == "Bye"
    assert merged["show_tax_on_receipt"] is True
    assert merged["financial_documents"]["display_name"] == "Corner Shop"
    assert len(merged["financial_documents"]["payment_fields"]) == 1


def test_merge_business_config_defaults_when_missing():
    merged = merge_business_config(None)
    assert "financial_documents" in merged
    assert merged["financial_documents"]["logo_url"] == DEFAULT_LOGO_URL


def test_merge_business_config_normalizes_existing_fd():
    merged = merge_business_config(
        {"financial_documents": {"paper_size": "A4", "logo_url": "https://z"}},
    )
    assert merged["financial_documents"]["paper_size"] == "A4"
    assert merged["financial_documents"]["logo_url"] == "https://z"


def test_normalize_apply_to_existing_flag():
    assert normalize_financial_documents({}).get("apply_to_existing") is False
    assert normalize_financial_documents({"apply_to_existing": True})["apply_to_existing"] is True
    assert normalize_financial_documents({"apply_to_existing": 1})["apply_to_existing"] is True
