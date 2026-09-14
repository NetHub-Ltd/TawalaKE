from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from pydantic import EmailStr
from app.api.deps import SessionDep, AuthUser, get_redis, AsyncRedis
from app.models.models import Tenant, Staff, StaffRole, Organization, Tenant, Sale, Plan, SaleAnalyticsSummary, StaffBusinessAssignment
from app.api.deps import SessionDep, AuthUser, universal_key_builder, purge_cache_namespace
from app.schemas.schemas import StaffResponse, TenantResponse, TenantCreate, ApiResponse
from sqlmodel import select
from pydantic import EmailStr
from app.models.models import Product, Business
from uuid import UUID
from app.crud.organization import organization_crud
from app.core.mailer import mailer
from app.crud import subscription as subscription_crud
from app.models.models import Staff, StaffRole
from datetime import datetime, timezone
from app.core.redis_client import limiter
from fastapi_cache.decorator import cache
from sqlalchemy import update
from app.utils.logging import logger
from app.crud.store import store_crud
from app.schemas.plans import PlanRead
from typing import List, Optional
from sqlalchemy.orm import selectinload
from app.schemas.sale import SaleReadWithRelations

router = APIRouter()

# --- Redis Cache Durations ---
CACHE_TTL_SEC = 300  # 5 minutes cache visibility matrix


@router.get("/test-email")
@limiter.limit("2/minute")
# @cache(expire=CACHE_TTL_SEC, namespace="organizations", key_builder=universal_key_builder)
async def send_test_email(request: Request, email: EmailStr, background_tasks: BackgroundTasks):
    background_tasks.add_task(
     mailer.send_testing,
     to_email=email)
    return {"status": "accepted", "message": "System Testing Sent!."}


@router.get("/sales",status_code=status.HTTP_200_OK, response_model=List[SaleReadWithRelations] )
async def fetch_sales(
    db: SessionDep,
    user: AuthUser,
    business_id: UUID,
    ):
    """
    Fetches all sales for a business scoped by user role and tenant,
    eagerly loading related business, cashier, and customer data.
    """
    # Step 1: Guarantee Multi-Tenant Isolation
    stmt = select(Sale).where(Sale.business_id == business_id)

    # Step 2: Role-Based Access Control
    if user.role == StaffRole.CASHIER:
        stmt = stmt.where(Sale.cashier_id == user.id)
    elif user.role not in (StaffRole.OWNER, StaffRole.MANAGER):
        return []

    # Step 3: Eager Loading Options & Reverse Chronological Ordering
    stmt = stmt.options(
        selectinload(Sale.business),
        selectinload(Sale.cashier),
        selectinload(Sale.customer),
        selectinload(Sale.items),
    ).order_by(Sale.updated_at.desc())

    results = await db.exec(stmt)
    sales = results.all()

    one_sale = sales[0] if sales else None
    logger.info(f"Fetched sale {one_sale.id} customer: {one_sale.customer.name if one_sale and one_sale.customer else 'N/A'} cashier: {one_sale.cashier.id if one_sale and one_sale.cashier else 'N/A'} business: {one_sale.business.name if one_sale and one_sale.business else 'N/A'}" if one_sale else "No sales found.")
    return sales


@router.post("/jobs/trial-ending-reminders")
@limiter.limit("5/minute")
async def job_trial_ending_reminders(
    request: Request,
    db: SessionDep,
    background_tasks: BackgroundTasks,
    within_days: int = 3,
):
    """
    Ops/cron: email owners whose trial ends within `within_days`.
    Idempotency is best-effort (one send per call window); schedule daily.
    """
    rows = await subscription_crud.list_trials_ending_within(
        db, within_days=within_days
    )
    queued = 0
    skipped = 0
    for sub, plan, org in rows:
        # Owner email: organization.email or first OWNER staff
        to_email = (getattr(org, "email", None) or "").strip()
        owner_name = None
        if not to_email or "@" not in to_email:
            try:
                from app.models.models import Staff, StaffRole
                owners = list(
                    await db.exec(
                        select(Staff).where(
                            Staff.organization_id == org.id,
                            Staff.role == StaffRole.OWNER,
                        )
                    )
                )
                for o in owners:
                    em = (getattr(o, "email", None) or "").strip()
                    if em and "@" in em:
                        to_email = em
                        owner_name = getattr(o, "full_name", None) or getattr(
                            o, "name", None
                        )
                        break
            except Exception as exc:  # noqa: BLE001
                logger.warning(f"owner lookup failed org={org.id}: {exc}")
        if not to_email or "@" not in to_email:
            skipped += 1
            continue
        end = sub.end_date
        if end and end.tzinfo is None:
            from datetime import timezone as tz
            end = end.replace(tzinfo=tz.utc)
        from datetime import datetime, timezone as tz
        now = datetime.now(tz.utc)
        days_left = max(0, (end.date() - now.date()).days) if end else 0
        end_s = end.strftime("%Y-%m-%d") if end else ""
        billing_url = f"https://tawala.nethub.co.ke/org/{org.id}/billing"
        background_tasks.add_task(
            mailer.send_trial_ending,
            to_email,
            org_name=getattr(org, "name", None) or "your business",
            plan_name=getattr(plan, "name", None) or getattr(plan, "code", "Trial"),
            days_left=days_left,
            end_date=end_s,
            billing_url=billing_url,
            owner_name=owner_name,
        )
        queued += 1
    logger.info(
        f"trial-ending-reminders within_days={within_days} queued={queued} skipped={skipped}"
    )
    return {
        "status": "accepted",
        "within_days": within_days,
        "queued": queued,
        "skipped": skipped,
    }

