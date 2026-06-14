from typing import Type
from uuid import UUID

from fastapi import HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import datetime


from app.crud.base import BaseCRUD
from app.models.models import Business, StaffBusinessAssignment, Staff, StockHistory, StockMovementType
from app.schemas.schemas import BusinessCreate, BusinessUpdate
from app.schemas.business import StaffRequest, ProductAuditRequest, ProductRestockRequest
from app.utils.logging import logger
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from sqlmodel import select
from app.models.models import ( Product
)
from app.schemas.business import StockTakeRequest
from app.utils.logging import logger
from app.utils.helpers import utc_now

class StoreCrud(BaseCRUD[Business, BusinessCreate, BusinessUpdate]):
    def __init__(self, model: Type[Business]):
        super().__init__(model)


    async def get_tenant_businesses(self, db: AsyncSession, tenant_id: UUID):
        """
        Retrieves all businesses associated with a specified tenant ID.
        """
        # Using pure SQLModel select() ensures db.exec().all() returns clean model instances,
        # not raw database row-tuples.
        stmt = select(self.model).where(self.model.tenant_id == tenant_id)
        result = (await db.exec(stmt)).all() 
        
        if not result:
            return []

        needs_commit = False

        # Because of SQLModel's design, 'biz' here is cleanly inferred as a Business instance.
        # No weird tuple unpacking like 'for (biz,) in result:' needed!
        for biz in result:
            if not biz.organization_id:
                logger.info(f"Staging organization_id update to {tenant_id}")
                biz.organization_id = tenant_id
                db.add(biz)
                needs_commit = True

        if needs_commit:
            await db.commit()
            for biz in result:
                await db.refresh(biz)

        return result

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
        
    async def audit_stock(self, db: AsyncSession, payload: ProductAuditRequest, current_user) -> StockHistory:
        """
        Executes an isolated physical stock reconciliation audit for a target product.
        Computes variance deltas and commits state changes atomically with strict trail tracking.
        """
        try:
            # 1. Fetch product with row-level write validation locking protection (FOR UPDATE)
            stmt = select(Product).where(Product.id == payload.product_id).with_for_update()
            result = await db.execute(stmt)
            product = result.scalar_one_or_none()

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail="The targeted product entry was not found in this business catalog."
                )

            previous_stock = product.stock
            
            # 🔑 CRITICAL BUSINESS LOGIC: payload.quantity is the absolute count counted on the shelf.
            # Variance = Physical Count Reality - Current System Book Record
            quantity_delta = payload.quantity - previous_stock

            # 2. Map structural adjustments to the single source of truth timeline ledger
            history_entry = StockHistory(
                product_id=product.id,
                business_id=product.business_id,
                performed_by=current_user.id,
                movement_type=StockMovementType.ADJUSTMENT, # Matches your true database enum type name
                quantity=quantity_delta,
                previous_stock=previous_stock,
                new_stock=payload.quantity, # The final verified shelf volume
                buying_price=product.cost_price,
                selling_price=product.selling_price,
                reference_type=payload.reference_type or "MANUAL_AUDIT",
                reason_code=payload.reason_code,
                notes=payload.notes
            )

            # 3. Apply state mutation adjustments down to the product master record
            product.stock = payload.quantity
            product.last_stock_take = utc_now() # Timezone-aware date stamp (TIMESTAMP WITH TIME ZONE)

            db.add(product)
            db.add(history_entry)

            # 4. Execute atomic transaction commitment
            await db.commit()
            await db.refresh(product)
            
            return product

        except HTTPException:
            await db.rollback()
            raise
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"Critical exception captured during database inventory reconciliation sequence: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to commit inventory reconciliation adjustments safely due to a database level conflict."
            )
        

    async def add_new_stock(self, db: AsyncSession, payload: ProductRestockRequest, current_user) -> StockHistory:
        """
        Executes a secure inbound inventory restock operation.
        Increments physical item volumes and updates catalog cost/selling margins 
        atomically while safeguarding the historical trace timeline.
        """
        try:
            # 1. Fetch product with row-level write validation locking protection (FOR UPDATE)
            stmt = select(Product).where(Product.id == payload.product_id).with_for_update()
            result = await db.execute(stmt)
            product = result.scalar_one_or_none()

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail="The targeted product entry was not found in this business catalog."
                )

            # 2. Compute snapshots for inventory historical balancing metrics
            previous_stock = product.stock
            new_stock = previous_stock + payload.quantity

            # 3. Create the historical ledger trail record
            # Automatically falls back to the current catalog price parameters if the incoming transaction lacks explicit overrides
            history_entry = StockHistory(
                product_id=product.id,
                business_id=product.business_id, 
                performed_by=current_user.id,
                movement_type=StockMovementType.STOCK_TAKE, 
                quantity=payload.quantity,
                previous_stock=previous_stock,
                new_stock=new_stock,
                buying_price=payload.buying_price if payload.buying_price is not None else product.cost_price,
                selling_price=payload.selling_price if payload.selling_price is not None else product.selling_price,
                reference_id=payload.reference_id,
                reference_type=payload.reference_type or "PURCHASE_ORDER",
                notes=payload.notes
            )

            # 4. Mutate master product ledger catalog values directly in memory
            product.stock = new_stock
            
            # Update purchase cost structures if valid parameters are parsed
            if payload.buying_price is not None and payload.buying_price > 0:
                product.cost_price = payload.buying_price

            # Apply new selling/shelf marks if provided in the batch restock payload
            if payload.selling_price is not None and payload.selling_price > 0:
                product.selling_price = payload.selling_price

            # Stage transactional models into the current Active Unit of Work
            db.add(product)
            db.add(history_entry)

            # 5. Execute atomic database flush commitment
            await db.commit()
            
            # Refresh the history entry row so it populates the auto-generated primary key UUID and timestamp strings
            await db.refresh(product)
            return product

        except HTTPException:
            await db.rollback()
            raise
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"Database infrastructure collision during bulk stocking pipeline execution: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Database transaction conflict encountered while updating inventory levels."
            )


store_crud = StoreCrud(Business)