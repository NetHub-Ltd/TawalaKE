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
from app.schemas.business import StaffRequest, StockTakeRequest
from app.utils.logging import logger
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from sqlmodel import select
from app.models.models import ( Product,
    StockMovementType, StockTakeStatus
)
from app.schemas.business import StockTakeRequest
from app.utils.logging import logger

class BusinessCrud(BaseCRUD[Business, BusinessCreate, BusinessUpdate]):
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
        
    async def stocking(self, db: AsyncSession, payload: StockTakeRequest, current_user):
        # This method is now a unified handler for both physical stock taking and new stock intake with pricing
        # The presence of purchase_cost_price in the payload items determines if it's an intake operation
        try:
            stock = InventoryTransaction(**payload.model_dump(exclude_unset=True, performed_by=current_user.id)
            )

            db.add(stock)
            await db.flush()  # Flush to get the transaction ID for related items
            product = db.get(Product, stock.product_id) 
            if not product:
                raise HTTPException(status_code=404, detail="Product not found for stock take operation")

             # Assuming all items are for the same product for simplicity
            # now update the products table, update the price, stock levels, and create inventory transaction items  dont overwite existing stock levels until the end of the transaction
            prod_data = Product(
                stock=stock.new_stock if stock.new_stock is not None else product.stock,  # Update stock if new_stock is provided
                selling_price=stock.selling_price if stock.selling_price else product.selling_price,
                cost_price=stock.buying_price if stock.buying_price else product.cost_price
            )
            db.add(prod_data)
            await db.commit()
            return stock
        
        except SQLAlchemyError as error:
            await db.rollback()
            logger.error(f"An error occurred during the stocking operation: {error}")
            raise HTTPException(
                status_code=500, 
                detail="Internal transactional pipeline failure during stocking operation"
            )

business_crud = BusinessCrud(Business)