from fastapi import APIRouter, HTTPException, Request, Depends, BackgroundTasks
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
from app.core.redis_client import limiter
from app.schemas.store import StoreCreate, StoreResponse
from app.core.security import security
from app.core.mailer import mailer
from app.core.config import settings
from app.utils.logging import logger

# Directly utilizing your provided dependency definitions
from app.api.deps import SessionDep, get_redis, AsyncRedis, universal_key_builder, purge_cache_namespace

router = APIRouter()
CACHE_TTL_SEC = 300 

def _frontend_base_url() -> str:
    """Normalize settings.frontend_url into an absolute origin."""
    url = (settings.frontend_url or "").strip()
    if not url:
        return "https://tawala.nethub.co.ke"
    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"https://{url}"
    return url.rstrip("/")


@router.post("/onboarding", response_model=ApiResponse[StaffResponse])
async def create_tenant(
    request: Request,
    db: SessionDep,
    payload: StaffOnboard,
    background_tasks: BackgroundTasks,
    redis_client: AsyncRedis = Depends(get_redis),
):
    """
    Start self-serve onboarding: create pending OWNER + org shell, email setup link.
    Account remains inactive until password is set via /auth/onboarding/set-password.
    """
    staff = await organization_crud.onboard_tenant(payload, db)
    await purge_cache_namespace(redis_client, "organizations")

    # Opaque single-use token (reuses reset keyspace; longer TTL for email delivery)
    setup_token = await security.create_password_reset_token(
        staff_id=staff.id,
        redis_client=redis_client,
        expire_minutes=60,
    )
    setup_url = f"{_frontend_base_url()}/onboarding/set-password?token={setup_token}"
    client_ip = request.client.host if request.client else "Unknown"

    background_tasks.add_task(
        mailer.send_onboarding_setup,
        to_email=staff.email,
        setup_url=setup_url,
        user_name=getattr(staff, "full_name", None),
        ip_address=client_ip,
        expire_minutes=60,
    )
    logger.info(f"Onboarding setup email queued for staff {staff.id}")

    return ApiResponse(
        status=True,
        status_code=201,
        message="Check your email to verify your account and set a password.",
        data=staff,
    )

@router.patch("/update-org", status_code=201, response_model=ApiResponse[OrgResponse])
@limiter.limit("20/minute")
async def updates_organization(request: Request, organization_id: UUID, db: SessionDep, user: AuthUser, payload: OrgUpdate, redis_client: AsyncRedis = Depends(get_redis)):
    # only owner can perfom this operation
    if user.role != StaffRole.OWNER and organization_id == user.organization_id:
        raise HTTPException(status_code=403, detail="Not Authorized to perform this action!")

    org = await organization_crud.get_organization_by_id(db=db, org_id=organization_id)

    if org is None:
        raise HTTPException(status_code=404, detail="Organization Not Found")

    new_org = await organization_crud.update(db=db ,db_obj=org, obj_in=payload)
    await db.commit()
    await db.refresh(new_org)

    await purge_cache_namespace(redis_client, namespace="organizations", business_id=new_org.id)

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
    
    if organization_id != user.organization_id:
        raise HTTPException(status_code=403, detail="You dont have access to perform this action")
        
    businesses = await business_crud.get_tenant_businesses(tenant_id=organization_id, db=db)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Businesses retrieved successfully",
        data=businesses
    )

@router.get('/staff/{organization_id}', response_model=ApiResponse[List[StaffResponse]])
@cache(expire=CACHE_TTL_SEC, namespace="organizations", key_builder=universal_key_builder)
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


@router.post('/new-store', status_code=200, response_model=ApiResponse[StoreResponse])
async def register_new_store(db: SessionDep, payload: StoreCreate, user: AuthUser):
    if user.role != "OWNER" and payload.organization != user.organization_id:
        raise HTTPException(status_code=403, detail="You are not allowed to perform this action")

    store = await organization_crud.register_store(db, payload, user)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Store created succesfully",
        data=store
    )
