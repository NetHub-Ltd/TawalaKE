"""Customer workspace CRUD — list, detail, create, update, soft-delete."""
from __future__ import annotations

from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import col, func, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession
from loguru import logger

from app.models.models import Customer, Sale, SaleStatus
from app.schemas.customer import (
    CustomerCreate,
    CustomerDetailResponse,
    CustomerResponse,
    CustomerSaleRow,
    CustomerUpdate,
)
from app.utils.helpers import validate_and_format_kenyan_phone


class CustomerCRUD:
    def _normalize_phone(self, phone: Optional[str]) -> Optional[str]:
        if not phone:
            return None
        formatted = validate_and_format_kenyan_phone(phone, format=False)
        return formatted or phone.strip()

    async def _aggregates(
        self, db: AsyncSession, customer_id: UUID
    ) -> Tuple[float, int, float, int]:
        open_stmt = (
            select(
                func.coalesce(func.sum(Sale.total_amount), 0.0),
                func.count(Sale.id),
            )
            .where(Sale.customer_id == customer_id)
            .where(Sale.status == SaleStatus.PENDING_PAYMENT)
        )
        if hasattr(Sale, "deleted_at"):
            open_stmt = open_stmt.where(col(Sale.deleted_at).is_(None))
        open_total, open_count = (await db.exec(open_stmt)).one()

        done_stmt = (
            select(
                func.coalesce(func.sum(Sale.total_amount), 0.0),
                func.count(Sale.id),
            )
            .where(Sale.customer_id == customer_id)
            .where(Sale.status == SaleStatus.COMPLETED)
        )
        if hasattr(Sale, "deleted_at"):
            done_stmt = done_stmt.where(col(Sale.deleted_at).is_(None))
        life_rev, done_count = (await db.exec(done_stmt)).one()
        return (
            float(open_total or 0),
            int(open_count or 0),
            float(life_rev or 0),
            int(done_count or 0),
        )

    async def to_response(self, db: AsyncSession, customer: Customer) -> CustomerResponse:
        open_t, open_c, life, done = await self._aggregates(db, customer.id)
        return CustomerResponse(
            id=customer.id,
            business_id=customer.business_id,
            organization_id=customer.organization_id,
            name=customer.name,
            phone=customer.phone,
            email=customer.email,
            open_credit_total=open_t,
            open_credit_sales_count=open_c,
            lifetime_revenue=life,
            completed_orders_count=done,
            created_at=getattr(customer, "created_at", None),
            updated_at=getattr(customer, "updated_at", None),
        )

    async def list_customers(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        q: Optional[str] = None,
        has_open_credit: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[CustomerResponse], int]:
        filters = [
            Customer.business_id == business_id,
            col(Customer.deleted_at).is_(None),
        ]
        if q:
            term = f"%{q.strip()}%"
            filters.append(
                or_(
                    col(Customer.name).ilike(term),
                    col(Customer.phone).ilike(term),
                    col(Customer.email).ilike(term),
                )
            )

        count_stmt = select(func.count()).select_from(Customer).where(*filters)
        total = int((await db.exec(count_stmt)).one() or 0)

        stmt = (
            select(Customer)
            .where(*filters)
            .order_by(col(Customer.name).asc())
            .offset(max(0, skip))
            .limit(max(1, min(limit, 100)))
        )
        rows = list((await db.exec(stmt)).all())
        items: List[CustomerResponse] = []
        for c in rows:
            items.append(await self.to_response(db, c))

        if has_open_credit is True:
            items = [i for i in items if i.open_credit_total > 0]
            # Note: filter after page is approximate; full filter would use subquery
            total = len(items) if skip == 0 else total
        elif has_open_credit is False:
            items = [i for i in items if i.open_credit_total <= 0]

        return items, total

    async def get(
        self, db: AsyncSession, *, customer_id: UUID, business_id: UUID
    ) -> Customer:
        stmt = (
            select(Customer)
            .where(Customer.id == customer_id)
            .where(Customer.business_id == business_id)
            .where(col(Customer.deleted_at).is_(None))
        )
        row = (await db.exec(stmt)).one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Customer not found")
        return row

    async def get_detail(
        self, db: AsyncSession, *, customer_id: UUID, business_id: UUID
    ) -> CustomerDetailResponse:
        customer = await self.get(db, customer_id=customer_id, business_id=business_id)
        base = await self.to_response(db, customer)
        sales_stmt = (
            select(Sale)
            .where(Sale.customer_id == customer_id)
            .order_by(col(Sale.created_at).desc())
            .limit(20)
        )
        if hasattr(Sale, "deleted_at"):
            sales_stmt = sales_stmt.where(col(Sale.deleted_at).is_(None))
        sales = list((await db.exec(sales_stmt)).all())
        recent = [
            CustomerSaleRow(
                id=s.id,
                status=s.status.value if hasattr(s.status, "value") else str(s.status),
                total_amount=float(s.total_amount or 0),
                created_at=getattr(s, "created_at", None),
                updated_at=getattr(s, "updated_at", None),
            )
            for s in sales
        ]
        open_stmt = (
            select(Sale)
            .where(Sale.customer_id == customer_id)
            .where(Sale.status == SaleStatus.PENDING_PAYMENT)
            .order_by(col(Sale.created_at).desc())
            .limit(50)
        )
        if hasattr(Sale, "deleted_at"):
            open_stmt = open_stmt.where(col(Sale.deleted_at).is_(None))
        open_rows = list((await db.exec(open_stmt)).all())
        open_credit_sales = [
            CustomerSaleRow(
                id=s.id,
                status=s.status.value if hasattr(s.status, "value") else str(s.status),
                total_amount=float(s.total_amount or 0),
                created_at=getattr(s, "created_at", None),
                updated_at=getattr(s, "updated_at", None),
            )
            for s in open_rows
        ]
        return CustomerDetailResponse(
            **base.model_dump(),
            recent_sales=recent,
            open_credit_sales=open_credit_sales,
        )

    async def create(
        self,
        db: AsyncSession,
        *,
        payload: CustomerCreate,
        organization_id: Optional[UUID],
    ) -> Customer:
        phone = self._normalize_phone(payload.phone)
        if phone:
            existing = (
                await db.exec(
                    select(Customer)
                    .where(Customer.business_id == payload.business_id)
                    .where(Customer.phone == phone)
                    .where(col(Customer.deleted_at).is_(None))
                )
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A customer with this phone already exists for this business.",
                )

        obj = Customer(
            business_id=payload.business_id,
            organization_id=organization_id,
            name=payload.name,
            phone=phone,
            email=payload.email,
        )
        db.add(obj)
        try:
            await db.commit()
            await db.refresh(obj)
            return obj
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error("customer create failed: {}", e)
            raise HTTPException(
                status_code=500, detail="Failed to create customer."
            ) from e

    async def update(
        self,
        db: AsyncSession,
        *,
        customer_id: UUID,
        business_id: UUID,
        payload: CustomerUpdate,
    ) -> Customer:
        obj = await self.get(db, customer_id=customer_id, business_id=business_id)
        data = payload.model_dump(exclude_unset=True)
        if "phone" in data:
            data["phone"] = self._normalize_phone(data.get("phone"))
            if data["phone"]:
                clash = (
                    await db.exec(
                        select(Customer)
                        .where(Customer.business_id == business_id)
                        .where(Customer.phone == data["phone"])
                        .where(Customer.id != customer_id)
                        .where(col(Customer.deleted_at).is_(None))
                    )
                ).first()
                if clash:
                    raise HTTPException(
                        status_code=409,
                        detail="Another customer already uses this phone.",
                    )
        for k, v in data.items():
            setattr(obj, k, v)
        db.add(obj)
        try:
            await db.commit()
            await db.refresh(obj)
            return obj
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error("customer update failed: {}", e)
            raise HTTPException(status_code=500, detail="Failed to update customer.") from e

    async def soft_delete(
        self, db: AsyncSession, *, customer_id: UUID, business_id: UUID
    ) -> None:
        obj = await self.get(db, customer_id=customer_id, business_id=business_id)
        open_t, open_c, _, _ = await self._aggregates(db, customer_id)
        if open_t > 0 or open_c > 0:
            raise HTTPException(
                status_code=409,
                detail="Cannot delete customer with open credit. Collect outstanding sales first.",
            )
        from app.utils.helpers import utc_now

        obj.deleted_at = utc_now()
        db.add(obj)
        try:
            await db.commit()
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error("customer delete failed: {}", e)
            raise HTTPException(status_code=500, detail="Failed to delete customer.") from e


customer_crud = CustomerCRUD()
