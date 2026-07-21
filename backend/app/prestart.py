import asyncio
from sqlmodel import select
from app.core.config import settings
from app.core.session import AsyncSessionLocal
from app.core.security import security
from app.utils.logging import logger
from app.models.models import (
    Organization, 
    Business, 
    Staff, 
    StaffBusinessAssignment, 
    StaffRole
)
from app.schemas.schemas import TenantCreate

# Default data object mapping directly against Kenyan market environment variables
data = TenantCreate(
    name=settings.admin_name,
    email=settings.admin_email,
    phone_number="0723404490",  # Standard KES regional formatting placeholder
    address="Makutano"
)

async def create_admin_tenant(payload: TenantCreate = data) -> None:
    """
    Idempotent prestart initialization pipeline that verifies and provisions 
    the base Organization, a primary default Business branch storefront, and 
    the system administrator Staff profile with explicit OWNER authorization flags.
    
    Prevents account lockout situations during subsequent system redeployments.
    """
    async with AsyncSessionLocal() as session:
        try:
            # Step 1: Enforce Strict Idempotency Guard (Verify if Admin User Already Exists)
            staff_check = await session.exec(select(Staff).where(Staff.email == payload.email))
            existing_staff = staff_check.first()
            
            if existing_staff:
                logger.info(f"✨ Idempotency Guard: System admin user '{payload.email}' already exists. Skipping allocation.")
                return

            logger.info(f"🏁 Commencing foundational multi-tenant system provisioning for: {payload.email}")

            # Step 2: Query or Generate the Top-Level Organization node
            org_check = await session.exec(select(Organization).where(Organization.email == payload.email))
            organization = org_check.first()
            
            if not organization:
                logger.info("🏢 Target Organization layer missing. Generating new corporate entity node...")
                organization = Organization(
                    name=payload.name,
                    email=payload.email,
                    phone_number=payload.phone_number,
                    address=payload.address
                )
                session.add(organization)
                # Flush changes to assign database-generated operational UUID components immediately
                await session.flush()
            else:
                logger.info(f"ℹ️ Reusing existing Organization entity footprint: {organization.id}")

            # Step 3: Query or Instantiate a Default Storefront Business Branch
            biz_check = await session.exec(select(Business).where(Business.organization_id == organization.id))
            business = biz_check.first()
            
            if not business:
                logger.info("🏪 No localized branch storefronts found. Building initial system location branch...")
                business = Business(
                    name=f"{payload.name} Main Branch",
                    organization_id=organization.id,
                    tenant_id=organization.id  # Matches common mixin architectural conventions if configured
                )
                session.add(business)
                await session.flush()
            else:
                logger.info(f"ℹ️ Reusing default operational business node location: {business.id}")

            # Step 4: Securely Provision the Primary Staff Account as the System OWNER
            logger.info("👤 Hashing admin authorization credentials and constructing staff records...")
            hashed_pwd = security.hash_password(settings.admin_password)
            
            admin_staff = Staff(
                email=payload.email,
                full_name=payload.name,
                hashed_password=hashed_pwd,
                role=StaffRole.OWNER,  # Enforces explicit executive system owner authorization status
                active=True,
                is_active=True,        # Protective safety property mapping variations
                organization_id=organization.id,
                tenant_id=organization.id
            )
            session.add(admin_staff)
            await session.flush()

            # Step 5: Map Identity Permissions to Business Node (StaffBusinessAssignment)
            logger.info("🔗 Binding staff administrative record contexts onto new business store branches...")
            assignment = StaffBusinessAssignment(
                staff_id=admin_staff.id,
                business_id=business.id,
                role=StaffRole.OWNER
            )
            session.add(assignment)

            # Step 6: Atomically Commit Unit of Work
            await session.commit()
            logger.info("🚀 Global application environment admin setup complete. Lockout protections successfully locked.")

        except Exception as error:
            await session.rollback()
            logger.error(f"❌ Fatal operations error encountered during execution loop: {str(error)}")
            raise error

async def main() -> None:
    logger.info("Starting initialization sequence...")
    await create_admin_tenant()

if __name__ == "__main__":
    asyncio.run(main())