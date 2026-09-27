"""Business.config.financial_documents — receipt/invoice branding & payment details.

Stored under Business.config JSONB. Generation (Celery) is internal; viewing is
gated by documents:read on the API.
"""
from __future__ import annotations

from typing import Any

DEFAULT_LOGO_URL = "https://tawala.nethub.co.ke/logo.svg"
DEFAULT_TERMS = (
    "Payment is due within 30 days of the invoice date. "
    "Late payments may be subject to a 2% fee.\n"
    "Thank you for your business!"
)
DEFAULT_PAPER_SIZE = "A5"
MAX_PAYMENT_FIELDS = 3


def default_financial_documents() -> dict[str, Any]:
    return {
        "logo_url": DEFAULT_LOGO_URL,
        "display_name": None,  # None → use business.name
        "payment_fields": [],  # [{label, value}, ...] max 3
        "terms_and_conditions": DEFAULT_TERMS,
        "paper_size": DEFAULT_PAPER_SIZE,  # A5 | A4
    }


def normalize_financial_documents(raw: Any) -> dict[str, Any]:
    """Merge user input with defaults; clamp payment fields to 3."""
    base = default_financial_documents()
    if not isinstance(raw, dict):
        return base

    logo = raw.get("logo_url")
    if isinstance(logo, str) and logo.strip():
        base["logo_url"] = logo.strip()[:2048]
    elif logo is None or logo == "":
        base["logo_url"] = DEFAULT_LOGO_URL

    display = raw.get("display_name")
    if display is None or (isinstance(display, str) and not display.strip()):
        base["display_name"] = None
    elif isinstance(display, str):
        base["display_name"] = display.strip()[:200]

    terms = raw.get("terms_and_conditions")
    if isinstance(terms, str) and terms.strip():
        base["terms_and_conditions"] = terms.strip()[:4000]
    else:
        base["terms_and_conditions"] = DEFAULT_TERMS

    paper = str(raw.get("paper_size") or DEFAULT_PAPER_SIZE).upper()
    base["paper_size"] = paper if paper in ("A5", "A4") else DEFAULT_PAPER_SIZE

    fields_in = raw.get("payment_fields") or []
    fields: list[dict[str, str]] = []
    if isinstance(fields_in, list):
        for item in fields_in[:MAX_PAYMENT_FIELDS]:
            if not isinstance(item, dict):
                continue
            label = str(item.get("label") or "").strip()[:80]
            value = str(item.get("value") or "").strip()[:200]
            if label or value:
                fields.append({"label": label or "Detail", "value": value})
    base["payment_fields"] = fields
    return base


def get_financial_documents_from_business_config(config: Any) -> dict[str, Any]:
    cfg = config if isinstance(config, dict) else {}
    return normalize_financial_documents(cfg.get("financial_documents"))


def merge_business_config(
    existing: Any,
    *,
    financial_documents: Any | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Shallow-merge business.config; normalize financial_documents when provided."""
    out: dict[str, Any] = dict(existing) if isinstance(existing, dict) else {}
    if extra:
        for k, v in extra.items():
            if k == "financial_documents":
                continue
            out[k] = v
    if financial_documents is not None:
        out["financial_documents"] = normalize_financial_documents(financial_documents)
    elif "financial_documents" not in out:
        out["financial_documents"] = default_financial_documents()
    else:
        out["financial_documents"] = normalize_financial_documents(
            out.get("financial_documents")
        )
    return out
