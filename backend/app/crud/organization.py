from app.models.models import Tenant, Organization, Business
from app.schemas.schemas import TenantCreate, TenantUpdate
from app.crud.base import BaseCRUD
from typing import Type
from sqlmodel.ext.asyncio.session import AsyncSession
from app.utils.logging import logger
from sqlmodel import select, update
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fastapi import HTTPException as HttpException
from uuid import UUID
from app.core.security import hash_password
from fastapi import HTTPException


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

    async def get_organization_by_id(self, org_id: UUID, db: AsyncSession) -> Organization:
        stmt = select(Organization).where(Organization.id == org_id)
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
            tenant_id=tenant_id,
            role=StaffRole.CASHIER,  # default role for new staff, can be updated later
            hashed_password=hash_password(password) if password else "TEMP_DISABLED"
        )
        db.add(staff)
        await db.commit()
        await db.refresh(staff)
        return staff


    async def migrate_single_tenant_to_organization(self, db: AsyncSession, tenant_id: UUID) -> Organization:
        """
        Migrates a production Tenant record to the Organizations table.
        
        Handles two critical production scenarios:
        1. Clean Migration: No matching organization exists. Creates a new one keeping the Tenant ID.
        2. Partial Migration Collision: An organization exists with the correct email but a different
        auto-generated ID. It updates/corrects that organization's ID to preserve downstream foreign keys.
        """
        try:
            # 1. Fetch the legacy tenant record
            tenant_stmt = select(Tenant).where(Tenant.id == tenant_id)
            tenant_result = await db.exec(tenant_stmt)
            tenant = tenant_result.one_or_none()
            
            if not tenant:
                logger.error(f"Migration aborted: Tenant with ID {tenant_id} not found in database.")
                raise HTTPException(status_code=404, detail="Tenant not found")

            # 2. Idempotency Check Scenario A: Perfect matching ID already exists
            org_id_stmt = select(Organization).where(Organization.id == tenant_id)
            org_id_result = await db.exec(org_id_stmt)
            existing_org_by_id = org_id_result.one_or_none()
            
            if existing_org_by_id:
                logger.info(f"Idempotency match: Organization with ID {tenant_id} already exists.")
                return existing_org_by_id

            # 3. Collision Check Scenario B: Organization exists with matching email but WRONG ID
            org_email_stmt = select(Organization).where(Organization.email == tenant.email)
            org_email_result = await db.exec(org_email_stmt)
            existing_org_by_email = org_email_result.one_or_none()

            if existing_org_by_email:
                logger.warning(
                    f"Partial migration detected for email '{tenant.email}'. "
                    f"Existing wrong ID: {existing_org_by_email.id} will be corrected to Tenant ID: {tenant_id}"
                )
                
                # To change a primary key seamlessly without SQLAlchemy state-tracking conflicts,
                # we execute an atomic update statement directly against the database engine.
                update_stmt = (
                    update(Organization)
                    .where(Organization.id == existing_org_by_email.id)
                    .values(
                        id=tenant_id,
                        name=tenant.name,
                        active=tenant.active,
                        updated_at=tenant.updated_at
                    )
                )
                await db.execute(update_stmt)
                
                # Fetch the updated record back into the session tracking layer
                refetched_stmt = select(Organization).where(Organization.id == tenant_id)
                refetched_result = await db.exec(refetched_stmt)
                updated_org = refetched_result.one()
                
                await db.commit()
                logger.info(f"Successfully resolved partial migration loop for ID: {tenant_id}")
                return updated_org

            # 4. Clean Migration Scenario: Complete greenfield mapping
            logger.info(f"Executing clean migration path for Tenant ID: {tenant_id}")
            new_org = Organization(
                id=tenant.id,
                name=tenant.name,
                email=tenant.email,
                active=tenant.active,
                created_at=tenant.created_at,
                updated_at=tenant.updated_at,
                deleted_at=tenant.deleted_at,
                phone=None,
                address=None,
                tax_number=None,
                logo_url=None
            )

            db.add(new_org)
            await db.commit()
            await db.refresh(new_org)
            
            logger.info(f"Successfully executed clean migration for Tenant '{tenant.name}'")
            return new_org

        except Exception as e:
            await db.rollback()
            logger.error(f"Critical transaction failure during migration of tenant {tenant_id}: {str(e)}")
            raise e

organization_crud = OrganizationCrud(Organization)