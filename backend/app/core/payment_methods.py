"""Payment method catalog and org/business enablement resolution.

Stored under Organization.config["payment_methods"] and Business.config["payment_methods"].
Shape per code: { "enabled": bool, "label": optional str, "sort_order": optional int }

Resolution: start from system defaults → apply org → apply business.
Org disabled cannot be re-enabled by business (most restrictive wins).
"""
from __future__ import annotations

from typing import Any

# Canonical codes (must match PaymentMethod enum values used for money methods).
# CREDIT is the POS label for PaymentMethod.INVOICE.
CASH = "CASH"
MPESA = "MPESA"
CREDIT = "CREDIT"  # maps to PaymentMethod.INVOICE
CARD = "CARD"
STK_PUSH = "STK_PUSH"

# POS code → API PaymentMethod value
POS_TO_API = {
    CASH: "CASH",
    MPESA: "MPESA",
    CREDIT: "INVOICE",
    CARD: "CARD",
    STK_PUSH: "MPESA",  # future: distinct; treat as mpesa rail until STK ships
}

API_TO_POS = {
    "CASH": CASH,
    "MPESA": MPESA,
    "INVOICE": CREDIT,
    "CARD": CARD,
}


def system_catalog() -> list[dict[str, Any]]:
    """Ordered catalog — source of truth for labels and capabilities."""
    return [
        {
            "code": CASH,
            "api_method": "CASH",
            "label": "Cash",
            "collects_money": True,
            "requires_reference": False,
            "requires_amount_given": True,
            "supports_change": True,
            "enabled_default": True,
            "sort_order": 10,
        },
        {
            "code": MPESA,
            "api_method": "MPESA",
            "label": "M-Pesa",
            "collects_money": True,
            "requires_reference": True,
            "requires_amount_given": True,
            "supports_change": False,
            "enabled_default": True,
            "sort_order": 20,
        },
        {
            "code": CREDIT,
            "api_method": "INVOICE",
            "label": "Credit (pay later)",
            "collects_money": False,
            "requires_reference": False,
            "requires_amount_given": False,
            "supports_change": False,
            "enabled_default": True,
            "sort_order": 30,
        },
        {
            "code": CARD,
            "api_method": "CARD",
            "label": "Card",
            "collects_money": True,
            "requires_reference": False,
            "requires_amount_given": True,
            "supports_change": False,
            "enabled_default": False,
            "sort_order": 40,
        },
        {
            "code": STK_PUSH,
            "api_method": "MPESA",
            "label": "M-Pesa STK Push",
            "collects_money": True,
            "requires_reference": False,
            "requires_amount_given": False,
            "supports_change": False,
            "enabled_default": False,
            "sort_order": 50,
        },
    ]


def _layer_map(raw: Any) -> dict[str, dict[str, Any]]:
    """Normalize config payment_methods to {code: {enabled, label?, sort_order?}}."""
    out: dict[str, dict[str, Any]] = {}
    if not isinstance(raw, dict):
        return out
    for code, val in raw.items():
        key = str(code).upper()
        if isinstance(val, bool):
            out[key] = {"enabled": val}
        elif isinstance(val, dict):
            out[key] = {
                "enabled": bool(val["enabled"]) if "enabled" in val else True,
                **{k: v for k, v in val.items() if k != "enabled"},
            }
    return out


def resolve_payment_methods(
    org_config: Any = None,
    business_config: Any = None,
) -> list[dict[str, Any]]:
    """Effective methods for a branch POS, sorted."""
    org_cfg = org_config if isinstance(org_config, dict) else {}
    biz_cfg = business_config if isinstance(business_config, dict) else {}
    org_layer = _layer_map(org_cfg.get("payment_methods"))
    biz_layer = _layer_map(biz_cfg.get("payment_methods"))

    result: list[dict[str, Any]] = []
    for item in system_catalog():
        code = item["code"]
        enabled = bool(item["enabled_default"])
        label = item["label"]
        sort_order = item["sort_order"]

        if code in org_layer:
            enabled = bool(org_layer[code].get("enabled", enabled))
            if org_layer[code].get("label"):
                label = str(org_layer[code]["label"])
            if org_layer[code].get("sort_order") is not None:
                sort_order = int(org_layer[code]["sort_order"])

        if code in biz_layer:
            biz_en = biz_layer[code].get("enabled")
            if biz_en is not None:
                # Most restrictive: org off stays off
                if not enabled:
                    pass
                else:
                    enabled = bool(biz_en)
            if biz_layer[code].get("label"):
                label = str(biz_layer[code]["label"])
            if biz_layer[code].get("sort_order") is not None:
                sort_order = int(biz_layer[code]["sort_order"])

        result.append(
            {
                **item,
                "label": label,
                "enabled": enabled,
                "sort_order": sort_order,
            }
        )

    result.sort(key=lambda x: (x["sort_order"], x["code"]))
    return result


def enabled_pos_methods(
    org_config: Any = None,
    business_config: Any = None,
) -> list[dict[str, Any]]:
    """Methods shown on checkout (enabled only)."""
    return [
        {
            "code": m["code"],
            "api_method": m["api_method"],
            "label": m["label"],
            "collects_money": m["collects_money"],
            "requires_reference": m["requires_reference"],
            "requires_amount_given": m["requires_amount_given"],
            "supports_change": m["supports_change"],
            "requires_customer": True,
        }
        for m in resolve_payment_methods(org_config, business_config)
        if m["enabled"]
    ]


def compute_payment_amounts(
    *,
    amount_due: float,
    amount_given: float,
) -> dict[str, float]:
    """amount applied, change, and whether fully paid."""
    due = max(0.0, round(float(amount_due), 2))
    given = max(0.0, round(float(amount_given), 2))
    applied = min(given, due)
    change = round(max(0.0, given - due), 2)
    return {
        "amount_due_at_payment": due,
        "amount_given": given,
        "amount": applied,
        "change_due": change,
        "is_full": applied >= due - 0.001,
    }


def resolve_sale_status_after_payment(*, amount_due_before: float, amount_applied: float) -> str:
    """Return SaleStatus value after applying amount_applied toward amount_due_before.

    PENDING_PAYMENT — nothing applied (should not normally be called with applied=0 after a payment).
    PARTIALLY_PAID — applied > 0 but remaining still outstanding.
    COMPLETED — applied covers the due amount.
    """
    due = max(0.0, round(float(amount_due_before), 2))
    applied = max(0.0, round(float(amount_applied), 2))
    remaining = round(due - applied, 2)
    if remaining <= 0.001:
        return "COMPLETED"
    if applied > 0.001:
        return "PARTIALLY_PAID"
    return "PENDING_PAYMENT"


def sale_remaining_balance(*, total_amount: float, payments_sum: float) -> float:
    """Outstanding balance on a sale from totals already paid."""
    return max(0.0, round(float(total_amount or 0) - float(payments_sum or 0), 2))


def sync_sale_payment_columns(sale, payments) -> None:
    """Write denormalized amount_paid / balance_due onto the sale.

    Payments remain the ledger; these columns power list/detail without joins.
    Safe for empty payments (unpaid credit).
    """
    paid = 0.0
    for p in payments or []:
        if p is None:
            continue
        if isinstance(p, dict):
            paid += float(p.get("amount") or 0)
        else:
            paid += float(getattr(p, "amount", None) or 0)
    paid = round(paid, 2)
    total = round(float(getattr(sale, "total_amount", None) or 0), 2)
    status_val = getattr(sale, "status", None)
    if hasattr(status_val, "value"):
        status_val = status_val.value
    status_val = str(status_val or "")
    sale.amount_paid = paid
    if status_val == "COMPLETED":
        sale.balance_due = 0.0
    else:
        sale.balance_due = round(max(0.0, total - paid), 2)
