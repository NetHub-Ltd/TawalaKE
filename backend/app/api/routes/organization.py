from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from app.api.deps import SessionDep, AuthUser
from app.models.models import Organization, Tenant, Staff, StaffRole
from uuid import UUID
from sqlmodel import select
from app.crud.organization import organization_crud
from app.schemas.schemas import ApiResponse, BusinessResponse, StaffResponse, OrganizationResponse
from typing import List
from pydantic import EmailStr
from app.crud.business import business_crud
from fastapi_cache.decorator import cache
from app.schemas.org import OrgCreate, OrgUpdate, OrgResponse
from app.schemas.staff import StaffOnboard

# Directly utilizing your provided dependency definitions
from app.api.deps import SessionDep, get_redis, AsyncRedis,universal_key_builder, purge_cache_namespace

router = APIRouter()
CACHE_TTL_SEC = 300 

@router.post("/onboarding", response_model=ApiResponse[StaffResponse])
async def create_tenant(request: Request, db: SessionDep, payload: StaffOnboard, redis_client: AsyncRedis = Depends(get_redis)):
    # only allow onboarding if the user is not associated with any tenant

    new_tenant = await organization_crud.onboard_tenant(payload, db)
    await purge_cache_namespace(redis_client, "organizations")  # Clear organization cache after onboarding
    return ApiResponse(
        status=True,
        status_code=201,
        message="Tenant onboarded successfully",
        data=new_tenant
    )

@router.patch("/update-org", status_code=201, response_model=ApiResponse[OrgResponse])
async def updates_organization(organization_id: UUID, db: SessionDep, user: AuthUser, payload: OrgUpdate):
    # only owner can perfom this operation
    if user.role != StaffRole.OWNER and organization_id == user.organization_id:
        raise HTTPException(status_code=403, detail="Not Authorized to perform this action!")

    org = await organization_crud.get_organization_by_id(db=db, org_id=organization_id)

    if org is None:
        raise HTTPException(status_code=404, detail="Organization Not Found")

    new_org = await organization_crud.update(db=db ,db_obj=org, obj_in=payload)
    await db.commit()
    await db.refresh(new_org)
    return ApiResponse(
        status=True,
        message="Organization Updated Succesfully",
        status_code=201,
        data=new_org
    )



@router.get("/{organization_id}", response_model=OrganizationResponse)
@cache(expire=CACHE_TTL_SEC, namespace="organizations", key_builder=universal_key_builder) 
async def get_organization_by_id(organization_id: UUID, db: SessionDep, user: AuthUser):
    if organization_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Unathorized to perform this operation")
    
    org = await organization_crud.get_organization_by_id(db=db, org_id=organization_id)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Organization retrieved successfully",
        data=org
    )


@router.get('/stores/{organization_id}', response_model=ApiResponse[List[BusinessResponse]])
@cache(expire=CACHE_TTL_SEC, namespace="stores", key_builder=universal_key_builder) 
async def get_businesses_by_tenant(organization_id: UUID, db: SessionDep, user: AuthUser, active: bool = True):
    
    # if organization_id != user.organization_id:
    #     raise HTTPException(status_code=403, detail="You dont have access to perform this action")
    businesses = await business_crud.get_tenant_businesses(tenant_id=organization_id, db=db)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Businesses retrieved successfully",
        data=businesses
    )

@router.get('/staff/{organization_id}', response_model=ApiResponse[List[StaffResponse]])
@cache(expire=CACHE_TTL_SEC, namespace="staff", key_builder=universal_key_builder)
async def get_staff_by_tenant(organization_id: UUID, db: SessionDep, user: AuthUser, business_id: UUID = None):
    
    
    staff = await organization_crud.tenant_staff(organization_id, db, business_id=business_id)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Staff retrieved successfully",
        data=staff
    )


@router.get("/billing/{organization_id}", response_model=ApiResponse[List[BusinessResponse]])
@cache(expire=CACHE_TTL_SEC, namespace="billing", key_builder=universal_key_builder)
async def get_billing_by_tenant(organization_id: UUID, db: SessionDep, user: AuthUser, active: bool = True):
    
    # if organization_id != user.organization_id:
    #     raise HTTPException(status_code=403, detail="You dont have access to perform this action")
    businesses = await business_crud.get_tenant_businesses(tenant_id=organization_id, db=db)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Businesses retrieved successfully",
        data=businesses
    )
