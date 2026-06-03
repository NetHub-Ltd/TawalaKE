from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.api.deps import SessionDep, AuthUser
from app.models.models import Tenant, Staff, StaffRole
from uuid import UUID
from sqlmodel import select
from app.schemas.tenants import TenantCreate, TenantResponse
from app.crud.organization import organization_crud
from app.schemas.schemas import ApiResponse, BusinessResponse, StaffResponse
from typing import List
from pydantic import EmailStr

router = APIRouter()

@router.post("/onboarding", response_model=ApiResponse[TenantResponse])
async def create_tenant(db: SessionDep, user: AuthUser, data: TenantCreate):

    # only allow onboarding if the user is not associated with any tenant
    payload = TenantCreate(
        name=data.full_name,
        email=data.email,
        tenant_id=data.tenant_id,
        active=data.is_active
    )
    new_tenant = await organization_crud.onboard_organization(payload, db)
    return ApiResponse(
        status=True,
        status_code=201,
        message="Tenant onboarded successfully",
        data=new_tenant
    )

@router.post("/migrate")
async def migrate_tenant(db: SessionDep, email: EmailStr):
    # Implementation for migrating tenant
    stmt = select(Tenant).where(Tenant.email == email)
    result = (await db.exec(stmt)).first()

    if not result:
        raise HTTPException(status_code=404, detail="Tenant not found for migration")

    payload = TenantCreate(
        name=result.name,
        email=result.email,
        tenant_id=result.id,
        active=result.active
    )

    new_org = await organization_crud.onboard_tenant(payload=payload, db=db, password="")
    return ApiResponse(
        status=True,
        status_code=201,
        message="Tenant onboarded successfully",
        data=new_org
    )



# @router.get("/multi", response_model=ApiResponse[List[TenantResponse]])
# async def list_tenants(db: SessionDep):
#     stmt = select(Tenant)
#     tenants = (await db.exec(stmt)).all()
#     return ApiResponse(
#         status=True,
#         status_code=200,
#         message="Tenants retrieved successfully",
#         data=tenants
#     )


@router.get("/{tenant_id}", response_model=ApiResponse[TenantResponse])
async def get_tenant(tenant_id: UUID, db: SessionDep, user: AuthUser):
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    tenant = (await db.exec(stmt)).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return ApiResponse(
        status=True,
        status_code=200,
        message="Tenant retrieved successfully",
        data=tenant
    )

# @router.delete("/{tenant_id}", response_model=ApiResponse[None])
# async def delete_tenant(tenant_id: UUID, db: SessionDep, user: AuthUser):
#     stmt = select(Tenant).where(Tenant.id == tenant_id)
#     tenant = (await db.exec(stmt)).first()
#     if not tenant:
#         raise HTTPException(status_code=404, detail="Tenant not found")
    
#     await db.delete(tenant)
#     await db.commit()
#     return ApiResponse(
#         status=True,
#         status_code=200,
#         message="Tenant deleted successfully",
#         data=None
#     )

@router.get('/stores/{tenant_id}', response_model=ApiResponse[List[BusinessResponse]])
async def get_businesses_by_tenant(tenant_id: UUID, db: SessionDep, user: AuthUser, active: bool = True):
    businesses = await organization_crud.get_business_by_tenant(tenant_id, db, active=active)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Businesses retrieved successfully",
        data=businesses
    )

@router.get('/staff/{tenant_id}', response_model=ApiResponse[List[StaffResponse]])
async def get_staff_by_tenant(tenant_id: UUID, db: SessionDep, user: AuthUser, business_id: UUID = None):
    staff = await organization_crud.tenant_staff(tenant_id, db, business_id=business_id)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Staff retrieved successfully",
        data=staff
    )


# @router.post("/staff/new", response_model=ApiResponse[StaffResponse])
# async def add_staff_to_tenant(data: StaffResponse, db: SessionDep, user: AuthUser):
#     new_staff = await organization_crud.add_staff_to_tenant(data, db)
#     return ApiResponse(
#         status=True,
#         status_code=201,
#         message="Staff added successfully",
#         data=new_staff
#     )