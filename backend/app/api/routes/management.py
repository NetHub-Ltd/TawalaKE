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
