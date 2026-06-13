from fastapi import APIRouter, Depends, HTTPException
from pydantic import EmailStr
from app.api.deps import SessionDep, AuthUser
from app.models.models import Tenant, Staff, StaffRole, Organization, Tenant
from app.api.deps import SessionDep, AuthUser
from app.schemas.schemas import TenantResponse, TenantCreate
from sqlmodel import select
from app.core.security import hash_password
from pydantic import EmailStr
from app.models.models import Product, Business
from uuid import UUID
from app.crud.organization import organization_crud


router = APIRouter()

# route for Tawala admins and sysetm monitoring and management route

@router.get("/org")
async def get_organizations(db: SessionDep):
    stmt = select(Organization)
    orgs = (await db.exec(stmt)).all()
    return orgs

@router.get("/tenants")
async def get_tenants(db: SessionDep):
    stmt = select(Tenant)
    tenants = (await db.exec(stmt)).all()
    return tenants

@router.get('/stores')
async def get_stores(db: SessionDep):
    stmt = select(Business)
    stores = (await db.exec(stmt)).all()
    return stores


@router.get("/staff")
async def get_all_staff(db: SessionDep):
    stmt = select(Staff)
    staff_members = (await db.exec(stmt)).all()
    return staff_members

@router.patch("/migrate-org")
async def patch_business_org_id(db: SessionDep, tenant_id: UUID):
    migration = await organization_crud.migrate_single_tenant_to_organization(db, tenant_id)
    return migration


@router.patch("/patch-staff-password")
async def override_staff_password(db: SessionDep,staff_email: EmailStr, new_password: str):
    # if user.role != StaffRole.ADMIN:
    #     raise HTTPException(status_code=403, detail="Only admins can override passwords.")
    
    stmt = select(Staff).where(Staff.email == staff_email)
    staff_member = (await db.exec(stmt)).first()
    
    if not staff_member:
        raise HTTPException(status_code=404, detail="Staff member not found.")
    
    staff_member.hashed_password = hash_password(new_password)  # In a real application, ensure to hash the password
    db.add(staff_member)
    await db.commit()
    
    return {"message": "Password overridden successfully."}


@router.get("/all-products")
async def get_all_products(db: SessionDep):
    # This is a placeholder implementation. You would replace this with your actual logic to fetch products.
    # For example, you might have a Product model and you would query the database for all products.
    stmt = select(Product)  # Assuming you have a Product model defined
    products = (await db.exec(stmt)).all()
    return products

# register a new tenant for testing migration endpoint
@router.post('/new-tenant')
async def register_tenant(db: SessionDep, name: str, email: EmailStr):
    new = Tenant(
        name=name,
        email=email
    )
    db.add(new)
    await db.commit()
    return new