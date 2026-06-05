from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import SessionDep, AuthUser
from app.models.models import Tenant, Staff, StaffRole, Organization
from app.api.deps import SessionDep, AuthUser
from app.schemas.schemas import TenantResponse
from sqlmodel import select
from app.core.security import hash_password
from pydantic import EmailStr
from app.models.models import Product, Business
from uuid import UUID

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
asynce def get_all_staff(db: SessionDep):
    stmt = select(Staff)
    staff_members = (await db.exec(stmt)).all()
    return staff_members

@router.patch("/migrate-org")
async def patch_business_org_id(db: SessionDep, tenant_id: UUID, new_org_id: UUID):
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    tenant = (await db.exec(stmt)).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found.")
    
    
    org_stmt = select(Organization).where(Organization.email == tenant.email)
    org = (await db.exec(org_stmt)).first()
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found.")
    org_data = Organization(
        id=tenant.id,
        name=org.name,
        email=org.email
    )
    db.add(org_data)
    await db.flush()

    # find busineses with that tenant id and update the org id
    business_stmt = select(Business).where(Business.tenant_id == tenant_id)
    businesses = (await db.exec(business_stmt)).all()
    for business in businesses:
        business.organization_id = tenant_id
        db.add(business)
    await db.commit()
    
    return tenant


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