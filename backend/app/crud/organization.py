from app.models.models import Tenant, Organization, Business, StaffBusinessAssignment
from app.schemas.schemas import TenantCreate, TenantUpdate
from app.schemas.staff import StaffOnboard
from app.crud.base import BaseCRUD
from typing import Type
from sqlmodel.ext.asyncio.session import AsyncSession
from app.utils.logging import logger
from sqlmodel import select, update
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fastapi import HTTPException as HttpException
from uuid import UUID
from app.core.security import security
from fastapi import HTTPException
from app.schemas.org import OrgCreate
from app.crud.staff import staff_crud
from app.schemas.org import OrgUpdate
from app.schemas.store import StoreCreate


class OrganizationCrud(BaseCRUD[Organization, OrgCreate, TenantUpdate]):
    def __init__(self, model: Type[Organization]):
        super().__init__(model)
    
    async def onboard_tenant(self, payload: StaffOnboard, db: AsyncSession) -> Organization:
        staff = await staff_crud.onboard_staff(db, payload)
        return staff

    async def register_store(self, db: AsyncSession, payload: StoreCreate, current_user):
        store = Business(
            tenant_id=payload.organization_id,
            organization_id=payload.organization_id,
            industry=payload.industry,
            name=payload.name,
            phone=payload.phone,
            address=payload.address,
            tax_rate=0.0
        )
        db.add(store)
        await db.flush()

        assignment = StaffBusinessAssignment(
            staff_id=current_user.id,
            business_id=store.id,
            organization_id=store.organization_id,
            role=current_user.role,
        )

        db.add(assignment)

        await db.commit()
        await db.refresh(assignment)
        return store

    
    async def update_org(db: AsyncSession, payload: OrgUpdate):
        pass



    async def get_tenant_by_email(self, email: str, db: AsyncSession) -> Organization:
        stmt = select(self.model).where(self.model.email == email)
        tenant = (await db.exec(stmt)).first()
        if not tenant:
            raise HttpException(status_code=404, detail="Tenant not found")
        return tenant

    async def get_tenant_by_id(self, tenant_id: str, db: AsyncSession) -> Organization:
        stmt = select(self.model).where(self.model.id == tenant_id)
        tenant = (await db.exec(stmt)).first()
        if not tenant:
            raise HttpException(status_code=404, detail="Tenant not found")
        return tenant

    async def get_organization_by_id(self, org_id: UUID, db: AsyncSession) -> Organization:
        stmt = select(self.model).where(self.model.id == org_id)
        org = (await db.exec(stmt)).first()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        return org


    async def upgrade_tenant_plan(self, tenant_id: str, new_plan: str, db: AsyncSession) -> Tenant:
        tenant = await self.get_tenant_by_id(tenant_id, db)
        tenant.plan = new_plan
        db.add(tenant)
        await db.commit()
        await db.refresh(tenant)
        return tenant

    async def deactivate_tenant(self, tenant_id: str, db: AsyncSession) -> Tenant:
        tenant = await self.get_tenant_by_id(tenant_id, db)
        tenant.active = False
        db.add(tenant)
        await db.commit()
        await db.refresh(tenant)
        return tenant
    
    async def tenant_staff(self, organization_id: str, db: AsyncSession, business_id: UUID = None):
        from app.models.models import Staff
        stmt = select(Staff).where(Staff.organization_id == organization_id)
        if business_id:
            stmt = stmt.where(Staff.business_id == business_id)
        return (await db.exec(stmt)).all()
    
    async def get_business_by_tenant(self, organization_id: UUID, db: AsyncSession, active: bool):
        from app.models.models import Business
        stmt = select(Business).where(Business.organization_id == organization_id, Business.active == active)
        return (await db.exec(stmt)).all()
    
    async def register_staff(self, organization_id: UUID, db: AsyncSession, staff_data: TenantCreate, password: str = None):
        from app.models.models import Staff, StaffRole
        staff = Staff(
            full_name=staff_data.name,
            email=staff_data.email,
            organization_id=organization_id,
            tenant_id=organization_id,
            role=StaffRole.CASHIER,  # default role for new staff, can be updated later
            hashed_password=security.hash_password(password)
        )
        db.add(staff)
        await db.commit()
        await db.refresh(staff)
        return staff


organization_crud = OrganizationCrud(Organization)