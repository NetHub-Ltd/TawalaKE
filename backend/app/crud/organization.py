from app.models.models import Tenant, Organization, Business
from app.schemas.schemas import TenantCreate, TenantUpdate
from app.crud.base import BaseCRUD
from typing import Type
from sqlmodel.ext.asyncio.session import AsyncSession
from app.utils.logging import logger
from sqlmodel import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fastapi import HTTPException as HttpException
from uuid import UUID
from app.core.security import hash_password

class OrganizationCrud(BaseCRUD[Organization, TenantCreate, TenantUpdate]):
    def __init__(self, model: Type[Organization]):
        super().__init__(model)
    
    async def onboard_tenant(self, payload: TenantCreate, db: AsyncSession, password: str = "") -> Organization:
        try:
            # check if the tenant already exists
            stmt = select(self.model).where(self.model.email == payload.email)
            existing_tenant = (await db.exec(stmt)).first()

            if existing_tenant:
                logger.info(f"Tenant with email {payload.email} already exists. Returning existing tenant.")
                return existing_tenant
            # we need to slugify the name of the tenancy and append "workspace" to it to ensure uniqueness and avoid conflicts with reserved keywords
            workspace_name = f"{payload.name.lower().replace(' ', '-')}-workspace"
            tenant = Organization(
                name=workspace_name,
                email=payload.email,
                # id=payload.tenant_id,
                active=payload.active
            )
            db.add(tenant)
            await db.flush()  # get the ID before commit


            # ensure the owner exists as staff with an owner role
            from app.models.models import Staff, StaffRole
            owner_stmt = select(Staff).where(
                Staff.email == tenant.email
            )
            owner = (await db.exec(owner_stmt)).first()

            if not owner:
                logger.info(f"Owner with email {tenant.email} does not exist. Creating new owner.")
                owner = Staff(
                    organization_id=tenant.id,
                    full_name=tenant.name,
                    email=tenant.email,
                    tenant_id=tenant.id,
                    role=StaffRole.OWNER,
                    hashed_password=hash_password(password)  # to be updated later
                )
                db.add(owner)

            await db.commit()
            await db.refresh(tenant)
            return tenant
    
        except IntegrityError as e:
            logger.error(f"Error onboarding tenant: {e}")
            await db.rollback()
            raise HttpException(status_code=400, detail="Tenant with this email already exists.")
        except SQLAlchemyError as e:
            logger.error(f"Unexpected error onboarding tenant: {e}")
            await db.rollback()
            raise HttpException(status_code=500, detail="An unexpected error occurred.")

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
    
    async def tenant_staff(self, tenant_id: str, db: AsyncSession, business_id: UUID = None):
        from app.models.models import Staff
        stmt = select(Staff).where(Staff.tenant_id == tenant_id)
        if business_id:
            stmt = stmt.where(Staff.business_id == business_id)
        return (await db.exec(stmt)).all()
    
    async def get_business_by_tenant(self, tenant_id: UUID, db: AsyncSession, active: bool):
        from app.models.models import Business
        stmt = select(Business).where(Business.tenant_id == tenant_id, Business.active == active)
        return (await db.exec(stmt)).all()
    
    async def register_staff(self, tenant_id: str, staff_data: TenantCreate, db: AsyncSession, password: str = None):
        from app.models.models import Staff, StaffRole
        staff = Staff(
            full_name=staff_data.name,
            email=staff_data.email,
            organization_id=tenant_id,
            tenant_id=tenant_id,
            role=StaffRole.CASHIER,  # default role for new staff, can be updated later
            hashed_password=hash_password(password) if password else "TEMP_DISABLED"
        )
        db.add(staff)
        await db.commit()
        await db.refresh(staff)
        return staff

organization_crud = OrganizationCrud(Organization)