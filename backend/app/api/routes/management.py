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

@router.get("/org")
@limiter.limit("2/minute")
@cache(expire=CACHE_TTL_SEC, namespace="organizations", key_builder=universal_key_builder)
async def get_organizations(request: Request, db: SessionDep):
    stmt = select(Organization)
    orgs = (await db.exec(stmt)).all()
    return orgs

@router.get('/stores')
@limiter.limit("20/minute")
@cache(expire=CACHE_TTL_SEC, namespace="stores", key_builder=universal_key_builder)
async def get_stores(request: Request, db: SessionDep):
    stmt = select(Business)
    stores = (await db.exec(stmt)).all()
    return stores


@router.get("/all-products")
@limiter.limit("3/minute")
@cache(expire=CACHE_TTL_SEC, namespace="products", key_builder=universal_key_builder)
async def get_all_products(request: Request, db: SessionDep):
    # This is a placeholder implementation. You would replace this with your actual logic to fetch products.
    # For example, you might have a Product model and you would query the database for all products.
    stmt = select(Product)  # Assuming you have a Product model defined
    products = (await db.exec(stmt)).all()
    return products


@router.get('/sales')
@limiter.limit("20/minute")
@cache(expire=CACHE_TTL_SEC, namespace="sales", key_builder=universal_key_builder)
async def get_sales(request: Request, db: SessionDep, business_id: UUID = None):
    stmt = select(Sale)
    if business_id is not None:
        stmt = stmt.where(Sale.business_id == business_id)
    sales = (await db.exec(stmt)).all()
    return sales

@router.get("/billing-plans", response_model=ApiResponse[List[PlanRead]])
@limiter.limit("20/minute")
@cache(expire=CACHE_TTL_SEC, namespace="billing", key_builder=universal_key_builder)
async def get_billing_plans(request: Request, db: SessionDep):
    try:
        stmt = select(Plan)
        results = (await db.exec(stmt)).all()


        # Explicit conversion – this usually fixes the validation error
        # plans = [PlanRead.model_validate(plan) for plan in results]

        return ApiResponse(
            status=True,
            status_code=200,
            message="Plans retrieved succesfully",
            data=results
        )   

    except ValidationError as e:
        logger.error(f"We couldn't validate the data {e}")
        return HTTPException(status_code=500, detail="An error occured, please try again later")


@router.get("/get-business-anlytics")
@limiter.limit("5/minute")
@cache(expire=CACHE_TTL_SEC, namespace="analytics", key_builder=universal_key_builder)
async def get_business_analytics(request: Request, db: SessionDep, organization_id: Optional[UUID] = None, 
business_id: Optional[UUID] = None):
    # sales = await store_crud.get_business_analytics(db=db, business_id=business_id)
    # return sales
    stmt = select(SaleAnalyticsSummary)
    results = (await db.exec(stmt)).all()
    return results


@router.get("/all-staff", response_model=List[StaffResponse])
async def get_staff(request: Request, db: SessionDep):
    stmt = (select(Staff).options(selectinload(Staff.assigned_businesses)))
    staff_members = (await db.exec(stmt)).all()
    return staff_members



@router.post("/assign-business-to-staff", response_model=ApiResponse[StaffResponse])
async def assign_business_to_staff(
    request: Request,
    db: SessionDep,
    email: EmailStr,
    business_id: UUID,
    role: StaffRole = StaffRole.CASHIER  # Default role if not provided
):
    # Check if the staff member exists
    staff_member = (await db.exec(select(Staff).where(Staff.email == email))).first()
    if not staff_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")

    # Check if the business exists
    business = (await db.exec(select(Business).where(Business.id == business_id))).first()
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")

    # Create a new StaffBusinessAssignment
    assignment = StaffBusinessAssignment(staff_id=staff_member.id, business_id=business_id, role=role, organization_id=business.organization_id)
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)

    # return the staff member with the newly assigned business
    staff_member = (await db.exec(select(Staff).where(Staff.id == staff_member.id).options(selectinload(Staff.assigned_businesses)))).first()

    return ApiResponse(
        status=True,
        status_code=200,
        message="Business assigned to staff successfully",
        data=staff_member
    )