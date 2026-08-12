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


# return everything in staff and staffbusinessassignment tables for a given business_id
@router.get("/staff-business-assignments")
async def get_staff_business_assignments(request: Request, db: SessionDep):
    stmt = select(StaffBusinessAssignment)
    assignments = (await db.exec(stmt)).all()
    return assignments


@router.get("/all-staff", response_model=List[StaffResponse])
async def get_staff(request: Request, db: SessionDep):
    stmt = (select(Staff).options(selectinload(Staff.assigned_businesses)))
    staff_members = (await db.exec(stmt)).all()
    return staff_members


# @router.post("/patch-staff-assignments")
# async def get_staff_assignments(request: Request, db: SessionDep, staff_id: UUID):
#     stmt = (
#                 select(Staff)
#                 .where(Staff.id == staff_id)
#                 .options(selectinload(Staff.assigned_businesses))
#             )
#     staff_member = (await db.exec(stmt)).first()

#     if not staff_member:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")

#     logger.info(f"Staff member found: {staff_member.email} (ID: {staff_member.id}) with {len(staff_member.assigned_businesses)} assignments.")

#     stmt_assignments = select(StaffBusinessAssignment).where(StaffBusinessAssignment.staff_id == staff_member.id)
#     assignments = (await db.exec(stmt_assignments)).all()

#     # update the orgnization id
#     for assignment in assignments:
#         stmt_org = select(Organization).where(Organization.id == assignment.organization_id)
#         organization = (await db.exec(stmt_org)).first()
#         if organization:
#             assignment.organization_id = organization.id
#             await db.commit()

#     await db.refresh(staff_member)
#     logger.info(f"Refreshed staff member: {staff_member.email} (ID: {staff_member.id}) with {len(staff_member.assigned_businesses)} assignments.")
#     return staff_member.assigned_businesses


@router.post("/patch-staff-assignments")
async def patch_staff_assignments(
    request: Request,
    db: SessionDep,
):
    staff_members = (await db.exec(select(Staff))).all()

    for staff_member in staff_members:
        stmt_assignments = select(StaffBusinessAssignment).where(
            StaffBusinessAssignment.staff_id == staff_member.id
        )
        assignments = (await db.exec(stmt_assignments)).all()

        for assignment in assignments:
            stmt_org = select(Organization).where(
                Organization.id == assignment.organization_id
            )
            organization = (await db.exec(stmt_org)).first()

            if organization:
                assignment.organization_id = organization.id

    await db.commit()

    return {
        "message": "Staff assignments patched successfully",
        "staff_count": len(staff_members),
    }
