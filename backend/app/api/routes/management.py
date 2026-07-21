from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from pydantic import EmailStr
from app.api.deps import SessionDep, AuthUser, get_redis, AsyncRedis
from app.models.models import Tenant, Staff, StaffRole, Organization, Tenant, Sale
from app.api.deps import SessionDep, AuthUser, universal_key_builder, purge_cache_namespace
from app.schemas.schemas import TenantResponse, TenantCreate
from sqlmodel import select
from pydantic import EmailStr
from app.models.models import Product, Business
from uuid import UUID
from app.crud.organization import organization_crud
from app.core.mailer import mailer
from app.core.redis_client import limiter
from fastapi_cache.decorator import cache



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