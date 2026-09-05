"""Expense tracker request/response schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.models import ExpenseCategory


class ExpenseCreate(BaseModel):
    business_id: UUID
    category: ExpenseCategory = ExpenseCategory.OTHER
    amount: float = Field(gt=0, description="Must be greater than zero")
    currency: str = Field(default="KES", max_length=3)
    incurred_on: datetime
    vendor: Optional[str] = Field(default=None, max_length=150)
    notes: Optional[str] = Field(default=None, max_length=500)
    reference: Optional[str] = Field(default=None, max_length=100)


class ExpenseUpdate(BaseModel):
    category: Optional[ExpenseCategory] = None
    amount: Optional[float] = Field(default=None, gt=0)
    currency: Optional[str] = Field(default=None, max_length=3)
    incurred_on: Optional[datetime] = None
    vendor: Optional[str] = Field(default=None, max_length=150)
    notes: Optional[str] = Field(default=None, max_length=500)
    reference: Optional[str] = Field(default=None, max_length=100)


class ExpenseResponse(BaseModel):
    id: UUID
    organization_id: Optional[UUID] = None
    business_id: UUID
    recorded_by: Optional[UUID] = None
    category: ExpenseCategory
    amount: float
    currency: str
    incurred_on: datetime
    vendor: Optional[str] = None
    notes: Optional[str] = None
    reference: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ExpenseListResponse(BaseModel):
    items: List[ExpenseResponse]
    total: int
    total_amount: float


class ExpenseSummaryByCategory(BaseModel):
    category: str
    total_amount: float
    count: int


class ExpensePeriodSummary(BaseModel):
    total_amount: float
    count: int
    by_category: List[ExpenseSummaryByCategory] = Field(default_factory=list)
