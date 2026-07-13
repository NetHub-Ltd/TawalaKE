from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import EmailStr
from app.api.deps import SessionDep, AuthUser, get_redis, AsyncRedis
from app.models.models import Tenant, Staff, StaffRole, Organization, Tenant, Sale
from app.api.deps import SessionDep, AuthUser
from app.schemas.schemas import TenantResponse, TenantCreate
from sqlmodel import select
from app.core.security import hash_password
from pydantic import EmailStr
from app.models.models import Product, Business
from uuid import UUID
from app.crud.organization import organization_crud
from app.core.mailer import mailer



router = APIRouter()

@router.get("/test-email")
async def send_test_email(email: EmailStr, background_tasks: BackgroundTasks):
    background_tasks.add_task(
     mailer.send_testing,
     to_email=email)
    return {"status": "accepted", "message": "System Testing Sent!."}

@router.get("/org")
async def get_organizations(db: SessionDep):
    stmt = select(Organization)
    orgs = (await db.exec(stmt)).all()
    return orgs

@router.get('/stores')
async def get_stores(db: SessionDep):
    stmt = select(Business)
    stores = (await db.exec(stmt)).all()
    return stores


@router.get("/all-products")
async def get_all_products(db: SessionDep):
    # This is a placeholder implementation. You would replace this with your actual logic to fetch products.
    # For example, you might have a Product model and you would query the database for all products.
    stmt = select(Product)  # Assuming you have a Product model defined
    products = (await db.exec(stmt)).all()
    return products


@router.get('/sales')
async def get_sales(db: SessionDep, business_id: UUID = None):
    stmt = select(Sale)
    if business_id is not None:
        stmt = stmt.where(Sale.business_id == business_id)
    sales = (await db.exec(stmt)).all()
    return sales