import asyncio
from sqlmodel import select
from pydantic import ValidationError

from app.core.config import settings
from app.core.session import AsyncSessionLocal
from app.core.security import security
from app.utils.logging import logger
from app.utils.plans import PLANS_SEED
from app.models.models import (
    Organization,
    Business,
    Staff,
    StaffBusinessAssignment,
    StaffRole,
    Plan,
    PlatformUser,
    PlatformRole,
)
import secrets
from app.core.mailer import mailer
from app.schemas.schemas import TenantCreate
from app.schemas.plans import PlanSeed


# Default admin data
data = TenantCreate(
    name=settings.admin_name,
    email=settings.admin_email,
    phone_number="0723404490",
    address="Makutano"
)


async def seed_plans(session) -> None:
    """
    Idempotent seeding of billing plans with full Pydantic validation.

    - Validates every plan against PlanSeed before touching the database
    - Creates the plan if it does not exist
    - Updates price, limits and features if it already exists
    """
    logger.info("🌱 Seeding / updating billing plans...")

    for raw_plan in PLANS_SEED:
        # -------------------------------------------------
        # 1. Validate first (fail fast)
        # -------------------------------------------------
        try:
            validated = PlanSeed.model_validate(raw_plan)
        except ValidationError as exc:
            logger.error(f"❌ Plan validation failed for code={raw_plan.get('code')}")
            logger.error(exc)
            raise  # Stop startup if seed data is invalid

        plan_data = validated.model_dump()

        # -------------------------------------------------
        # 2. Upsert
        # -------------------------------------------------
        result = await session.exec(
            select(Plan).where(Plan.code == plan_data["code"])
        )
        plan = result.first()

        if plan:
            for key, value in plan_data.items():
                setattr(plan, key, value)
            logger.info(f"  ↺ Updated plan: {plan.code}")
        else:
            plan = Plan(**plan_data)
            session.add(plan)
            logger.info(f"  ✓ Created plan: {plan_data['code']}")

    await session.flush()
    logger.info("✅ Billing plans seed completed")


async def create_admin_tenant(payload: TenantCreate = data) -> None:
    """
    Idempotent prestart initialization pipeline that:
    1. Seeds billing plans (with validation)
    2. Verifies and provisions the base Organization
    3. Creates a primary default Business
    4. Creates the system administrator Staff with OWNER role
    """
    async with AsyncSessionLocal() as session:
        try:
            # -------------------------------------------------
            # 1. Seed billing plans first (global)
            # -------------------------------------------------
            await seed_plans(session)

            # -------------------------------------------------
            # 2. Idempotency guard for admin user
            # -------------------------------------------------
            staff_check = await session.exec(
                select(Staff).where(Staff.email == payload.email)
            )
            existing_staff = staff_check.first()

            if existing_staff:
                logger.info(
                    f"✨ Idempotency Guard: System admin '{payload.email}' already exists. "
                    "Skipping tenant provisioning."
                )
                await session.commit()
                return

            logger.info(f"🏁 Starting admin tenant provisioning for: {payload.email}")

            # -------------------------------------------------
            # 3. Organization
            # -------------------------------------------------
            org_check = await session.exec(
                select(Organization).where(Organization.email == payload.email)
            )
            organization = org_check.first()

            if not organization:
                logger.info("🏢 Creating root Organization...")
                organization = Organization(
                    name=payload.name,
                    email=payload.email,
                    phone=payload.phone_number,
                    address=payload.address,
                    active=True,
                )
                session.add(organization)
                await session.flush()
            else:
                logger.info(f"ℹ️ Reusing existing Organization: {organization.id}")

            # -------------------------------------------------
            # 4. Default Business
            # -------------------------------------------------
            biz_check = await session.exec(
                select(Business).where(Business.organization_id == organization.id)
            )
            business = biz_check.first()

            if not business:
                logger.info("🏪 Creating default Business branch...")
                business = Business(
                    name=f"{payload.name} Main Branch",
                    organization_id=organization.id,
                    tenant_id=organization.id,
                    active=True,
                )
                session.add(business)
                await session.flush()
            else:
                logger.info(f"ℹ️ Reusing existing Business: {business.id}")

            # -------------------------------------------------
            # 5. Admin Staff (OWNER)
            # -------------------------------------------------
            logger.info("👤 Creating system OWNER staff account...")
            hashed_pwd = security.hash_password(settings.admin_password)

            admin_staff = Staff(
                email=payload.email,
                full_name=payload.name,
                hashed_password=hashed_pwd,
                role=StaffRole.OWNER,
                active=True,
                organization_id=organization.id,
                tenant_id=organization.id,
            )
            session.add(admin_staff)
            await session.flush()

            # -------------------------------------------------
            # 6. Staff ↔ Business assignment
            # -------------------------------------------------
            logger.info("🔗 Assigning OWNER to the default business...")
            assignment = StaffBusinessAssignment(
                staff_id=admin_staff.id,
                business_id=business.id,
                organization_id=organization.id,
                role=StaffRole.OWNER,
            )
            session.add(assignment)

            # -------------------------------------------------
            # 7. Commit everything
            # -------------------------------------------------
            await session.commit()
            logger.info("🚀 Admin tenant + billing plans provisioning completed successfully")

        except Exception as error:
            await session.rollback()
            logger.error(f"❌ Fatal error during initialization: {str(error)}")
            raise error



async def ensure_platform_superadmin() -> None:
    """
    Idempotent: if PLATFORM_BOOTSTRAP_EMAIL is set and no SUPER_ADMIN exists,
    create one with a generated password and email the platform invite.

    Does not create tenant Staff. Safe to call on every startup.
    """
    raw = getattr(settings, "platform_bootstrap_email", None) or ""
    email = str(raw).strip().lower()
    if not email or "@" not in email:
        logger.info("Platform bootstrap skipped (PLATFORM_BOOTSTRAP_EMAIL not set)")
        return

    name = (getattr(settings, "platform_bootstrap_name", None) or "Platform Super Admin").strip()

    async with AsyncSessionLocal() as session:
        try:
            existing_sa = (
                await session.exec(
                    select(PlatformUser).where(
                        PlatformUser.role == PlatformRole.SUPER_ADMIN,
                        PlatformUser.deleted_at.is_(None),
                    )
                )
            ).first()
            if existing_sa:
                logger.info(
                    f"Platform SUPER_ADMIN already exists ({existing_sa.email}); bootstrap skipped"
                )
                return

            dup = (
                await session.exec(select(PlatformUser).where(PlatformUser.email == email))
            ).first()
            if dup and dup.deleted_at is None:
                logger.warning(
                    f"PLATFORM_BOOTSTRAP_EMAIL={email} already exists as platform user "
                    f"but not SUPER_ADMIN; not auto-promoting. Bootstrap skipped."
                )
                return

            temporary_password = secrets.token_urlsafe(18)
            user = PlatformUser(
                email=email,
                full_name=name,
                hashed_password=security.hash_password(temporary_password),
                role=PlatformRole.SUPER_ADMIN,
                active=True,
                must_change_password=True,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

            try:
                login_url = f"{settings.frontend_origin}/platform/login"
            except Exception:
                login_url = "/platform/login"

            try:
                mailer.send_platform_user_invite(
                    to_email=email,
                    temporary_password=temporary_password,
                    login_url=login_url,
                    user_name=name,
                    inviter_name="Tawala platform bootstrap",
                )
                logger.info(
                    f"Platform SUPER_ADMIN created id={user.id} email={email}; invite email sent"
                )
            except Exception as mail_err:
                logger.error(
                    f"Platform SUPER_ADMIN created id={user.id} email={email} but invite email "
                    f"failed: {type(mail_err).__name__}: {mail_err}. "
                    "Password was not logged; fix mailer and use password reset / re-invite."
                )
        except Exception as error:
            await session.rollback()
            logger.error(f"Platform bootstrap failed: {error}")
            raise



async def main() -> None:
    logger.info("Starting initialization sequence...")
    await create_admin_tenant()
    await ensure_platform_superadmin()


if __name__ == "__main__":
    asyncio.run(main())