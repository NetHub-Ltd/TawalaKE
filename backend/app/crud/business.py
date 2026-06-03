from typing import Type
from uuid import UUID

from fastapi import HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
import datetime

from app.crud.base import BaseCRUD
from app.models.models import Business, StaffBusinessAssignment, Staff
from app.schemas.schemas import BusinessCreate, BusinessUpdate
from app.schemas.business import StaffRequest
from app.utils.logging import logger
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import select
from app.models.models import (
    StockTake, StockTakeItem, Product,
    InventoryTransaction, StockMovementType, StockTakeStatus, StockBatch
)
from app.schemas.business import StockTakeCreate, StockTakeItemCreate

class BusinessCrud(BaseCRUD[Business, BusinessCreate, BusinessUpdate]):
    def __init__(self, model: Type[Business]):
        super().__init__(model)


    async def get_tenant_businesses(self, db: AsyncSession, tenant_id: UUID):
        stmt = select(self.model).where(self.model.tenant_id == tenant_id)
        result = await db.exec(stmt)
        return result.all()

    async def register_business(self, db_obj: BusinessCreate, db: AsyncSession)-> Business:
        new = await self.create(db, obj_in=db_obj)
        await db.commit()
        return new

    async def update_business(self, business_id: UUID, db_obj: BusinessUpdate, db: AsyncSession)-> Business:
        biz = await self.get(db, id=business_id)
        if not biz:
            raise HTTPException(status_code=404, detail="Business not found")
        new = await self.update(db, db_obj=biz, obj_in=db_obj)
        await db.commit()
        return new

    async def get_business_by_id(self,db: AsyncSession, business_id: UUID)-> Business:
        biz = await self.get(db, id=business_id)
        if not biz:
            raise HTTPException(status_code=404, detail="Business not found")
        return biz


    async def assign_staff_to_business(self, db: AsyncSession, payload: StaffRequest):
        try:
            # 1. Fetch the business and verify it exists
            biz = await self.get(db, id=payload.business_id)
            if not biz:
                raise HTTPException(status_code=404, detail="Business node not found")

            # 2. TODO RESOLVED: Verify both the staff and business belong to the same organization
            # We query the staff member's profile record to check their organization boundary
            staff_query = await db.execute(
                select(Staff).filter(Staff.id == payload.staff_id)
            )
            staff_member = staff_query.scalar_one_or_none()

            if not staff_member:
                raise HTTPException(status_code=404, detail="Staff profile record not found")

            # Validate multi-tenant structural boundaries match perfectly
            if staff_member.organization_id != biz.organization_id:
                raise HTTPException(
                    status_code=403, 
                    detail="Security Violation: Staff member and Business do not belong to the same organization"
                )

            # 3. Safe Upsert Execution Structure (Prevents UniqueViolationError / 409 conflicts)
            # We build a native PostgreSQL insert execution plan
            stmt = (
                insert(StaffBusinessAssignment)
                .values(
                    staff_id=payload.staff_id,
                    business_id=payload.business_id
                )
            )
            
            # If the assignment row link already exists, tell Postgres to do nothing gracefully
            stmt = stmt.on_conflict_do_nothing(
                index_elements=["staff_id", "business_id"]
            )
            
            await db.execute(stmt)
            await db.commit()

            # 4. Fetch and return the relationship assignment record state
            assignment_query = await db.execute(
                select(StaffBusinessAssignment).filter_by(
                    staff_id=payload.staff_id, 
                    business_id=payload.business_id
                )
            )
            assignment = assignment_query.scalar_one_or_none()
            
            return assignment

        except SQLAlchemyError as error:
            await db.rollback()
            logger.error(f"An error occurred when assigning staff to a business: {error}")
            raise HTTPException(
                status_code=500, 
                detail="Internal transactional pipeline failure while updating relationship assignment"
            )
        
    async def stock_intake(
        self, 
        db: AsyncSession, 
        payload: StockTakeCreate, 
        current_user
    ):
        """
        Unified method for:
        - Physical Stock Taking (counting)
        - Adding new stock with pricing (intake)
        """
        try:
            stock_take = StockTake(
                business_id=payload.business_id,
                performed_by=current_user.id,   # Adjust based on your TokenData
                notes=payload.notes or "",
                status=StockTakeStatus.COMPLETED,
                total_items_counted=len(payload.items)
            )

            db.add(stock_take)
            await db.flush()  # Get ID

            adjustments = []

            for item in payload.items:
                product = await db.get(Product, item.product_id)

                if not product or product.business_id != payload.business_id:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Product {item.product_id} not found in this business"
                    )

                # === NEW: Support for new stock intake with pricing ===
                if hasattr(item, 'purchase_cost_price') and item.purchase_cost_price is not None:
                    # This is new stock intake
                    batch = StockBatch(
                        product_id=item.product_id,
                        business_id=payload.business_id,
                        quantity_received=item.counted_stock,
                        quantity_remaining=item.counted_stock,
                        purchase_cost_price=item.purchase_cost_price,
                        selling_price=item.selling_price or product.selling_price,  # fallback to current
                        received_by=current_user.id,
                        notes=item.notes
                    )
                    db.add(batch)

                    # Record transaction
                    transaction = InventoryTransaction(
                        product_id=item.product_id,
                        business_id=payload.business_id,
                        performed_by=current_user.id,
                        movement_type=StockMovementType.PURCHASE,
                        quantity=item.counted_stock,
                        previous_stock=product.stock,
                        new_stock=product.stock + item.counted_stock,
                        reference_id=stock_take.id,
                        reference_type="stock_take",
                        notes=item.notes or "New stock intake"
                    )
                    db.add(transaction)

                    # Update total stock
                    product.stock += item.counted_stock

                else:
                    # Traditional stock take (counting only)
                    difference = item.counted_stock - product.stock

                    stock_take_item = StockTakeItem(
                        stock_take_id=stock_take.id,
                        product_id=item.product_id,
                        system_stock=product.stock,
                        counted_stock=item.counted_stock,
                        difference=difference,
                        notes=item.notes
                    )
                    db.add(stock_take_item)

                    if abs(difference) > 0.001:
                        movement_type = (
                            StockMovementType.ADJUSTMENT_IN 
                            if difference > 0 
                            else StockMovementType.ADJUSTMENT_OUT
                        )

                        transaction = InventoryTransaction(
                            product_id=item.product_id,
                            business_id=payload.business_id,
                            performed_by=current_user.id,
                            movement_type=movement_type,
                            quantity=difference,
                            previous_stock=product.stock,
                            new_stock=item.counted_stock,
                            reference_id=stock_take.id,
                            reference_type="stock_take",
                            notes=item.notes
                        )
                        db.add(transaction)

                        product.stock = item.counted_stock

                product.last_stock_take = datetime.datetime.utcnow()

                adjustments.append({
                    "product_id": str(item.product_id),
                    "action": "intake" if hasattr(item, 'purchase_cost_price') else "count",
                    "previous": float(product.stock) if 'previous' in locals() else None,
                    "new": float(item.counted_stock)
                })

            await db.commit()

            return {
                "status": "success",
                "stock_take_id": str(stock_take.id),
                "message": "Stock operation completed successfully",
                "items_processed": len(payload.items),
                "adjustments": adjustments
            }

        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Stock intake failed: {str(e)}"
            )


business_crud = BusinessCrud(Business)
