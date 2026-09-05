"""Expense tracker CRUD — business-scoped operating expenses."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional, Sequence, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import col, func, select
from sqlmodel.ext.asyncio.session import AsyncSession
from loguru import logger

from app.crud.base import BaseCRUD
from app.models.models import Expense, ExpenseCategory
from app.schemas.expense import (
    ExpenseCreate,
    ExpensePeriodSummary,
    ExpenseSummaryByCategory,
    ExpenseUpdate,
)


class ExpenseCRUD(BaseCRUD[Expense, ExpenseCreate, ExpenseUpdate]):
    async def create_expense(
        self,
        db: AsyncSession,
        *,
        payload: ExpenseCreate,
        organization_id: Optional[UUID],
        recorded_by: Optional[UUID],
    ) -> Expense:
        incurred = payload.incurred_on
        if incurred.tzinfo is None:
            incurred = incurred.replace(tzinfo=timezone.utc)

        obj = Expense(
            organization_id=organization_id,
            business_id=payload.business_id,
            recorded_by=recorded_by,
            category=payload.category,
            amount=float(payload.amount),
            currency=(payload.currency or "KES")[:3],
            incurred_on=incurred,
            vendor=payload.vendor,
            notes=payload.notes,
            reference=payload.reference,
        )
        db.add(obj)
        try:
            await db.commit()
            await db.refresh(obj)
            return obj
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error("expense create failed: {}", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to record expense.",
            ) from e

    async def list_expenses(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        category: Optional[ExpenseCategory] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[Sequence[Expense], int, float]:
        filters = [
            Expense.business_id == business_id,
            col(Expense.deleted_at).is_(None),
        ]
        if start is not None:
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
            filters.append(Expense.incurred_on >= start)
        if end is not None:
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            filters.append(Expense.incurred_on < end)
        if category is not None:
            filters.append(Expense.category == category)

        count_stmt = select(func.count()).select_from(Expense)
        sum_stmt = select(func.coalesce(func.sum(Expense.amount), 0.0)).select_from(Expense)
        data_stmt = select(Expense)
        for f in filters:
            count_stmt = count_stmt.where(f)
            sum_stmt = sum_stmt.where(f)
            data_stmt = data_stmt.where(f)

        data_stmt = (
            data_stmt.order_by(col(Expense.incurred_on).desc())
            .offset(skip)
            .limit(limit)
        )
        total = (await db.exec(count_stmt)).one()
        total_amount = float((await db.exec(sum_stmt)).one() or 0)
        items = (await db.exec(data_stmt)).all()
        return items, int(total or 0), total_amount

    async def update_expense(
        self,
        db: AsyncSession,
        *,
        expense_id: UUID,
        business_id: UUID,
        payload: ExpenseUpdate,
    ) -> Expense:
        obj = await self.get(db, expense_id, include_deleted=False)
        if not obj or obj.business_id != business_id:
            raise HTTPException(status_code=404, detail="Expense not found")
        data = payload.model_dump(exclude_unset=True)
        if "incurred_on" in data and data["incurred_on"] is not None:
            inc = data["incurred_on"]
            if getattr(inc, "tzinfo", None) is None:
                data["incurred_on"] = inc.replace(tzinfo=timezone.utc)
        for k, v in data.items():
            setattr(obj, k, v)
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    async def soft_delete_expense(
        self,
        db: AsyncSession,
        *,
        expense_id: UUID,
        business_id: UUID,
        actor_id: Optional[UUID] = None,
    ) -> Expense:
        obj = await self.get(db, expense_id, include_deleted=False)
        if not obj or obj.business_id != business_id:
            raise HTTPException(status_code=404, detail="Expense not found")
        obj.deleted_at = datetime.now(timezone.utc)
        if actor_id is not None:
            obj.deleted_by = actor_id
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    async def period_summary(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        start: datetime,
        end: datetime,
    ) -> ExpensePeriodSummary:
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)

        base = [
            Expense.business_id == business_id,
            col(Expense.deleted_at).is_(None),
            Expense.incurred_on >= start,
            Expense.incurred_on < end,
        ]
        total_stmt = select(
            func.coalesce(func.sum(Expense.amount), 0.0),
            func.count(Expense.id),
        ).where(*base)
        total_amount, count = (await db.exec(total_stmt)).one()

        cat_stmt = (
            select(
                Expense.category,
                func.coalesce(func.sum(Expense.amount), 0.0),
                func.count(Expense.id),
            )
            .where(*base)
            .group_by(Expense.category)
        )
        rows = (await db.exec(cat_stmt)).all()
        by_cat: List[ExpenseSummaryByCategory] = []
        for cat, amt, cnt in rows:
            cat_val = getattr(cat, "value", str(cat))
            by_cat.append(
                ExpenseSummaryByCategory(
                    category=cat_val,
                    total_amount=float(amt or 0),
                    count=int(cnt or 0),
                )
            )
        by_cat.sort(key=lambda x: x.total_amount, reverse=True)
        return ExpensePeriodSummary(
            total_amount=float(total_amount or 0),
            count=int(count or 0),
            by_category=by_cat,
        )


expense_crud = ExpenseCRUD(Expense)
