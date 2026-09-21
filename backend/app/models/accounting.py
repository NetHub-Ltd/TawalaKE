"""Minimal Accounting contract entries (T8 bridge until full Accounting Core).

Sales posts financial effects here; full GL is a later milestone.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import Column, DateTime, Numeric
from sqlmodel import Field

from app.models.base import BaseMixin
from app.models.column_types import str_enum_col


class FinancialEntryType(StrEnum):
    SALE_REVENUE = "sale_revenue"
    CUSTOMER_RECEIPT = "customer_receipt"
    SALE_RETURN = "sale_return"
    SUPPLIER_LIABILITY = "supplier_liability"
    SUPPLIER_PAYMENT = "supplier_payment"


class FinancialEntry(BaseMixin, table=True):
    __tablename__ = "financial_entries"

    business_id: UUID = Field(foreign_key="businesses.id", index=True)
    entry_type: FinancialEntryType = str_enum_col(FinancialEntryType.SALE_REVENUE)
    amount: Decimal = Field(sa_column=Column(Numeric(18, 4), nullable=False))
    currency: str = Field(default="KES", max_length=3)
    source_type: str = Field(max_length=64)  # sales_document, sales_payment
    source_id: UUID = Field(index=True)
    party_id: UUID | None = Field(default=None)
    memo: str | None = Field(default=None, max_length=512)
    occurred_at: datetime = Field(sa_type=DateTime(timezone=True), nullable=False)
