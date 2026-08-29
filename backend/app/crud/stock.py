"""
Stock domain CRUD — single owner of product.stock mutations and StockHistory writes.

Sales / store checkout must call into this module for any stock check or deduction.
Catalogue metadata stays in product_crud; business ops stay in store_crud.
"""
from __future__ import annotations

from typing import Any, List, Optional, Sequence, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import col, desc, func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.models import Product, Staff, StockHistory, StockMovementType
from app.schemas.business import ProductAuditRequest, ProductRestockRequest
from app.services.audit import record_audit
from app.utils.helpers import utc_now
from app.utils.logging import logger
from pydantic import BaseModel, Field


class ProductAdjustRequest(BaseModel):
    """Explicit manual stock adjustment (increase or decrease) with reason."""

    product_id: UUID
    business_id: UUID
    quantity: float = Field(..., description="Absolute units to add (positive) or remove (use direction).")
    direction: str = Field(..., description="'increase' or 'decrease'")
    reason_code: str = Field(..., min_length=2, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)
    reference_type: Optional[str] = Field("MANUAL_ADJUSTMENT")

    def signed_delta(self) -> float:
        d = (self.direction or "").strip().lower()
        if d not in ("increase", "decrease"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="direction must be 'increase' or 'decrease'.",
            )
        if self.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="quantity must be greater than zero.",
            )
        return self.quantity if d == "increase" else -self.quantity


class StockCrud:
    """Central stock operations for Tawala inventory workspace and POS."""

    async def get_product_for_update(
        self,
        db: AsyncSession,
        *,
        product_id: UUID,
        business_id: Optional[UUID] = None,
    ) -> Product:
        stmt = select(Product).where(Product.id == product_id).with_for_update()
        if business_id is not None:
            stmt = stmt.where(Product.business_id == business_id)
        result = await db.exec(stmt)
        product = result.one_or_none()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The targeted product entry was not found in this business catalog.",
            )
        return product

    async def check_availability(
        self,
        db: AsyncSession,
        *,
        product_id: UUID,
        quantity: float,
        business_id: Optional[UUID] = None,
    ) -> Product:
        product = await self.get_product_for_update(
            db, product_id=product_id, business_id=business_id
        )
        if product.track_stock and product.stock < quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Insufficient stock for '{product.label}'. "
                    f"Available: {product.stock}, Requested: {quantity}"
                ),
            )
        return product

    async def apply_movement(
        self,
        db: AsyncSession,
        *,
        product: Product,
        delta: float,
        new_stock: Optional[float] = None,
        movement_type: StockMovementType,
        performed_by: Optional[UUID],
        organization_id: Optional[UUID],
        business_id: UUID,
        notes: Optional[str] = None,
        reference_id: Optional[UUID] = None,
        reference_type: Optional[str] = None,
        reason_code: Optional[str] = None,
        buying_price: Optional[float] = None,
        selling_price: Optional[float] = None,
        commit: bool = True,
        touch_last_stock_take: bool = False,
    ) -> Tuple[Product, StockHistory, float, float]:
        """
        Apply a stock change on an already-locked Product row.

        If new_stock is provided it wins; otherwise previous + delta.
        Returns (product, history, previous_stock, new_stock).
        """
        previous = float(product.stock or 0)
        if new_stock is not None:
            target = float(new_stock)
            qty_for_history = target - previous
        else:
            target = previous + float(delta)
            qty_for_history = float(delta)

        if target < 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Stock for '{product.label}' cannot go below zero (would be {target}).",
            )

        if product.organization_id is None and organization_id is not None:
            product.organization_id = organization_id

        product.stock = target
        if touch_last_stock_take:
            product.last_stock_take = utc_now()

        history = StockHistory(
            organization_id=product.organization_id or organization_id,
            product_id=product.id,
            business_id=business_id,
            performed_by=performed_by,
            movement_type=movement_type,
            quantity=qty_for_history,
            previous_stock=previous,
            new_stock=target,
            buying_price=buying_price if buying_price is not None else product.cost_price,
            selling_price=selling_price if selling_price is not None else product.selling_price,
            reference_id=reference_id or product.id,
            reference_type=reference_type,
            reason_code=reason_code,
            notes=notes,
        )
        db.add(product)
        db.add(history)

        if commit:
            try:
                await db.commit()
                await db.refresh(product)
            except SQLAlchemyError as e:
                await db.rollback()
                logger.error(f"Stock movement commit failed: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database transaction conflict encountered while updating inventory levels.",
                ) from e

        return product, history, previous, target

    async def restock(
        self,
        db: AsyncSession,
        payload: ProductRestockRequest,
        current_user: Staff,
    ) -> Product:
        product = await self.get_product_for_update(
            db, product_id=payload.product_id, business_id=payload.business_id
        )
        product, _hist, before, after = await self.apply_movement(
            db,
            product=product,
            delta=float(payload.quantity),
            movement_type=StockMovementType.PURCHASE,
            performed_by=current_user.id,
            organization_id=current_user.organization_id,
            business_id=product.business_id,
            notes=payload.notes,
            reference_id=payload.reference_id,
            reference_type=payload.reference_type or "PURCHASE_ORDER",
            buying_price=payload.buying_price,
            selling_price=payload.selling_price,
            commit=True,
            touch_last_stock_take=True,
        )
        try:
            await record_audit(
            db,
            actor=current_user,
            action="stock.restock",
            resource_type="product",
            resource_id=product.id,
            organization_id=current_user.organization_id,
            business_id=product.business_id,
            meta={
                "before": before,
                "after": after,
                "qty": payload.quantity,
                "reference_type": payload.reference_type,
            },
            )
        except Exception as audit_err:
            logger.warning("stock audit event failed: %s", audit_err)
        return product

    async def count_stock(
        self,
        db: AsyncSession,
        payload: ProductAuditRequest,
        current_user: Staff,
    ) -> Product:
        """Physical count: payload.quantity is absolute shelf count."""
        product = await self.get_product_for_update(
            db, product_id=payload.product_id, business_id=payload.business_id
        )
        product, _hist, before, after = await self.apply_movement(
            db,
            product=product,
            delta=0,
            new_stock=float(payload.quantity),
            movement_type=StockMovementType.ADJUSTMENT,
            performed_by=current_user.id,
            organization_id=current_user.organization_id,
            business_id=product.business_id,
            notes=payload.notes or payload.reason_code,
            reference_type=payload.reference_type or "MANUAL_AUDIT",
            reason_code=payload.reason_code,
            commit=True,
            touch_last_stock_take=True,
        )
        try:
            await record_audit(
            db,
            actor=current_user,
            action="stock.count",
            resource_type="product",
            resource_id=product.id,
            organization_id=current_user.organization_id,
            business_id=product.business_id,
            meta={
                "before": before,
                "after": after,
                "reason_code": payload.reason_code,
            },
            )
        except Exception as audit_err:
            logger.warning("stock audit event failed: %s", audit_err)
        return product

    async def adjust_stock(
        self,
        db: AsyncSession,
        payload: ProductAdjustRequest,
        current_user: Staff,
    ) -> Product:
        delta = payload.signed_delta()
        product = await self.get_product_for_update(
            db, product_id=payload.product_id, business_id=payload.business_id
        )
        product, _hist, before, after = await self.apply_movement(
            db,
            product=product,
            delta=delta,
            movement_type=StockMovementType.ADJUSTMENT,
            performed_by=current_user.id,
            organization_id=current_user.organization_id,
            business_id=product.business_id,
            notes=payload.notes or payload.reason_code,
            reference_type=payload.reference_type or "MANUAL_ADJUSTMENT",
            reason_code=payload.reason_code,
            commit=True,
            touch_last_stock_take=True,
        )
        try:
            await record_audit(
            db,
            actor=current_user,
            action="stock.adjust",
            resource_type="product",
            resource_id=product.id,
            organization_id=current_user.organization_id,
            business_id=product.business_id,
            meta={
                "before": before,
                "after": after,
                "delta": delta,
                "direction": payload.direction,
                "reason_code": payload.reason_code,
            },
            )
        except Exception as audit_err:
            logger.warning("stock audit event failed: %s", audit_err)
        return product

    async def apply_sale_item_deduction(
        self,
        db: AsyncSession,
        *,
        product: Product,
        quantity: float,
        business_id: UUID,
        performed_by: Optional[UUID],
        unit_price: Optional[float],
        notes: str,
        commit: bool = False,
    ) -> Tuple[Product, StockHistory]:
        """
        Deduct stock for one sale line. Caller owns the transaction (commit=False typical).
        Product should already be loaded; will re-lock if needed by using current instance.
        """
        if not product.track_stock:
            return product, None  # type: ignore[return-value]

        if product.stock < quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Stock for '{product.label}' depleted. "
                    f"Only {product.stock} items left."
                ),
            )

        product, history, _b, _a = await self.apply_movement(
            db,
            product=product,
            delta=-float(quantity),
            movement_type=StockMovementType.SALE,
            performed_by=performed_by,
            organization_id=product.organization_id,
            business_id=business_id,
            notes=notes,
            reference_type="SALE",
            selling_price=unit_price,
            commit=commit,
            touch_last_stock_take=False,
        )
        if product.popularity_score is None:
            product.popularity_score = 0.1
        else:
            product.popularity_score += 0.1
        db.add(product)
        return product, history

    async def list_movements(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        product_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[dict], int]:
        """Return movement rows with performer label for History UI."""
        count_stmt = select(func.count()).select_from(StockHistory).where(
            StockHistory.business_id == business_id,
            StockHistory.product_id == product_id,
        )
        total = (await db.exec(count_stmt)).one()
        total_n = int(total[0] if isinstance(total, tuple) else total)

        stmt = (
            select(StockHistory, Staff)
            .where(
                StockHistory.business_id == business_id,
                StockHistory.product_id == product_id,
            )
            .outerjoin(Staff, Staff.id == StockHistory.performed_by)
            .order_by(desc(StockHistory.created_at))
            .offset(offset)
            .limit(min(limit, 200))
        )
        result = await db.exec(stmt)
        pairs = result.all()
        rows: List[dict] = []
        for pair in pairs:
            hist = pair[0] if isinstance(pair, (tuple, list)) else getattr(pair, "StockHistory", pair)
            staff = None
            if isinstance(pair, (tuple, list)) and len(pair) > 1:
                staff = pair[1]
            elif hasattr(pair, "__getitem__"):
                try:
                    hist, staff = pair[0], pair[1]
                except Exception:
                    hist = pair[0]
            who = None
            if staff is not None:
                who = getattr(staff, "full_name", None) or getattr(staff, "email", None)
            rows.append(
                {
                    "id": str(hist.id),
                    "created_at": hist.created_at.isoformat() if getattr(hist, "created_at", None) else None,
                    "movement_type": hist.movement_type.value
                    if hasattr(hist.movement_type, "value")
                    else str(hist.movement_type),
                    "quantity": hist.quantity,
                    "previous_stock": hist.previous_stock,
                    "new_stock": hist.new_stock,
                    "notes": hist.notes,
                    "reason_code": getattr(hist, "reason_code", None),
                    "reference_type": hist.reference_type,
                    "reference_id": str(hist.reference_id) if getattr(hist, "reference_id", None) else None,
                    "performed_by": str(hist.performed_by) if hist.performed_by else None,
                    "performed_by_name": who,
                }
            )
        return rows, total_n


stock_crud = StockCrud()
