from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.api.deps import SessionDep, AuthUser
from app.models.models import Organization, Tenant, Staff, StaffRole
from uuid import UUID
from sqlmodel import select
from app.schemas.tenants import TenantCreate, TenantResponse
from app.crud.organization import organization_crud
from app.schemas.schemas import ApiResponse, BusinessResponse, StaffResponse
from typing import List
from pydantic import EmailStr
from app.crud.business import business_crud

router = APIRouter()


@router.post("/onboarding", response_model=ApiResponse[TenantResponse])
async def create_tenant(db: SessionDep, data: TenantCreate):
    # only allow onboarding if the user is not associated with any tenant
    payload = TenantCreate(
        name=data.name,
        email=data.email,
        # tenant_id=data.tenant_id,
        active=data.active
    ) 
    new_tenant = await organization_crud.onboard_tenant(payload, db)
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


@router.get("/{organization_id}")
async def get_organization_by_id(organization_id: UUID, db: SessionDep, user: AuthUser):
    stmt = select(Organization).where(Organization.id == organization_id)
    organization = (await db.exec(stmt)).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    return ApiResponse(
        status=True,
        status_code=200,
        message="Organization retrieved successfully",
        data=organization
    )


@router.get('/stores/{organization_id}', response_model=ApiResponse[List[BusinessResponse]])
async def get_businesses_by_tenant(organization_id: UUID, db: SessionDep, user: AuthUser, active: bool = True):
    businesses = await business_crud.get_tenant_businesses(tenant_id=organization_id, db=db)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Businesses retrieved successfully",
        data=businesses
    )

@router.get('/staff/{organization_id}', response_model=ApiResponse[List[StaffResponse]])
async def get_staff_by_tenant(organization_id: UUID, db: SessionDep, user: AuthUser, business_id: UUID = None):
    staff = await organization_crud.tenant_staff(organization_id, db, business_id=business_id)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Staff retrieved successfully",
        data=staff
    )

