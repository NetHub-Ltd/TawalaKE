"""Customer management schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CustomerCreate(BaseModel):
    business_id: UUID
    name: str = Field(..., min_length=1, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[str] = Field(default=None, max_length=255)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        s = (v or "").strip()
        if not s:
            raise ValueError("name is required")
        return s

    @field_validator("phone", "email")
    @classmethod
    def empty_to_none(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        s = v.strip()
        return s or None


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[str] = Field(default=None, max_length=255)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        s = v.strip()
        if not s:
            raise ValueError("name cannot be empty")
        return s

    @field_validator("phone", "email")
    @classmethod
    def empty_to_none(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        s = v.strip()
        return s or None


class CustomerResponse(BaseModel):
    id: UUID
    business_id: UUID
    organization_id: Optional[UUID] = None
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    open_credit_total: float = 0
    open_credit_sales_count: int = 0
    lifetime_revenue: float = 0
    completed_orders_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CustomerListResponse(BaseModel):
    items: List[CustomerResponse]
    total: int


class CustomerSaleRow(BaseModel):
    id: UUID
    status: str
    total_amount: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CustomerDetailResponse(CustomerResponse):
    recent_sales: List[CustomerSaleRow] = Field(default_factory=list)
    open_credit_sales: List[CustomerSaleRow] = Field(default_factory=list)
