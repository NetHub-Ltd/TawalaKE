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
from app.core.redis_client import limiter
from app.schemas.store import StoreCreate, StoreResponse

# Directly utilizing your provided dependency definitions
from app.api.deps import SessionDep, get_redis, AsyncRedis,universal_key_builder, purge_cache_namespace
from datetime import datetime, timezone
from fastapi import BackgroundTasks
from app.crud import subscription as subscription_crud
from app.core.mailer import mailer
from app.utils.logging import logger
from app.schemas.plans import PlanRead
from pydantic import BaseModel
from typing import Optional, Any


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
@limiter.limit("20/minute")
async def updates_organization(
    request: Request,
    organization_id: UUID,
    db: SessionDep,
    user: AuthUser,
    payload: OrgUpdate,
    redis_client: AsyncRedis = Depends(get_redis),
):
    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    if role != StaffRole.OWNER.value and role != "OWNER":
        raise HTTPException(status_code=403, detail="Not Authorized to perform this action!")
    if str(organization_id) != str(user.organization_id) and str(organization_id) != str(
        getattr(user, "tenant_id", None)
    ):
        raise HTTPException(status_code=403, detail="Not Authorized to perform this action!")

    org = await organization_crud.get_organization_by_id(db=db, org_id=organization_id)
    if org is None:
        raise HTTPException(status_code=404, detail="Organization Not Found")

    new_org = await organization_crud.update(db=db, db_obj=org, obj_in=payload)
    await db.commit()
    await db.refresh(new_org)

    new_org = await subscription_crud.maybe_mark_onboarding_complete(db, new_org)

    await purge_cache_namespace(redis_client, namespace="organizations", business_id=new_org.id)

    return ApiResponse(
        status=True,
        status_code=201,
        message="Organization Updated Successfully",
        data=new_org,
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


# ---------------------------------------------------------------------------
# Plans / subscription / trial (Task 2)
# ---------------------------------------------------------------------------

class SubscriptionResponse(BaseModel):
    id: Any
    organization_id: Any
    plan_id: Optional[Any] = None
    tier: Optional[str] = None
    active: bool
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    plan_code: Optional[str] = None
    plan_name: Optional[str] = None


class OnboardingStatusResponse(BaseModel):
    organization_id: Any
    onboarding: bool
    has_active_subscription: bool
    profile_complete: bool
    role: str


def _require_owner(user) -> None:
    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    if str(role).upper() != "OWNER":
        raise HTTPException(status_code=403, detail="Only organization owners can perform this action")


@router.get("/plans", response_model=ApiResponse[list])
async def list_billing_plans(db: SessionDep, user: AuthUser):
    """Return public active plans from the database (seeded at startup)."""
    plans = await subscription_crud.list_public_plans(db)
    data = [
        {
            "id": str(p.id),
            "code": p.code,
            "name": p.name,
            "description": p.description,
            "price_monthly": p.price_monthly,
            "price_yearly": p.price_yearly,
            "currency": p.currency,
            "trial_days": p.trial_days,
            "sort_order": p.sort_order,
            "features": p.features or {},
            "limits": p.limits or {},
        }
        for p in plans
    ]
    return ApiResponse(status=True, status_code=200, message="Plans retrieved", data=data)


@router.get("/subscription", response_model=ApiResponse)
async def get_my_subscription(db: SessionDep, user: AuthUser):
    org_id = user.organization_id or user.tenant_id
    if not org_id:
        raise HTTPException(status_code=400, detail="No organization on account")
    sub = await subscription_crud.get_active_subscription(db, org_id)
    if not sub:
        return ApiResponse(status=True, status_code=200, message="No active subscription", data=None)
    plan_code = plan_name = None
    if sub.plan_id:
        from sqlmodel import select
        from app.models.models import Plan
        plan = (await db.exec(select(Plan).where(Plan.id == sub.plan_id))).first()
        if plan:
            plan_code, plan_name = plan.code, plan.name
    data = {
        "id": str(sub.id),
        "organization_id": str(sub.organization_id),
        "plan_id": str(sub.plan_id) if sub.plan_id else None,
        "tier": str(sub.tier.value if hasattr(sub.tier, "value") else sub.tier),
        "active": sub.active,
        "start_date": sub.start_date.isoformat() if sub.start_date else None,
        "end_date": sub.end_date.isoformat() if sub.end_date else None,
        "plan_code": plan_code,
        "plan_name": plan_name,
    }
    return ApiResponse(status=True, status_code=200, message="Subscription retrieved", data=data)


@router.get("/onboarding-status", response_model=ApiResponse)
async def get_onboarding_status(db: SessionDep, user: AuthUser):
    org_id = user.organization_id or user.tenant_id
    if not org_id:
        raise HTTPException(status_code=400, detail="No organization on account")
    org = await organization_crud.get_organization_by_id(db=db, org_id=org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    sub = await subscription_crud.get_active_subscription(db, org_id)
    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    data = {
        "organization_id": str(org.id),
        "onboarding": bool(org.onboarding),
        "has_active_subscription": sub is not None,
        "profile_complete": subscription_crud.profile_looks_complete(org),
        "role": str(role).upper(),
        "organization": {
            "id": str(org.id),
            "name": org.name,
            "email": org.email,
            "phone": org.phone,
            "address": org.address,
            "tax_number": getattr(org, "tax_number", None),
        },
    }
    return ApiResponse(status=True, status_code=200, message="Onboarding status", data=data)


@router.post("/trial/start", response_model=ApiResponse)
async def start_trial(
    db: SessionDep,
    user: AuthUser,
    background_tasks: BackgroundTasks,
):
    """OWNER only: start a 7-day NDOVU trial and email a zero-amount invoice."""
    _require_owner(user)
    org_id = user.organization_id or user.tenant_id
    if not org_id:
        raise HTTPException(status_code=400, detail="No organization on account")

    org = await organization_crud.get_organization_by_id(db=db, org_id=org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    sub, plan = await subscription_crud.start_ndovu_trial(db, org_id)
    org = await subscription_crud.maybe_mark_onboarding_complete(db, org)

    start_s = sub.start_date.strftime("%Y-%m-%d") if sub.start_date else ""
    end_s = sub.end_date.strftime("%Y-%m-%d") if sub.end_date else ""
    background_tasks.add_task(
        mailer.send_trial_invoice,
        to_email=user.email or org.email,
        org_name=org.name,
        plan_name=plan.name,
        trial_days=subscription_crud.TRIAL_DAYS,
        start_date=start_s,
        end_date=end_s,
        currency=plan.currency or "KES",
    )
    logger.info(f"Trial invoice queued for {user.email}")

    data = {
        "subscription_id": str(sub.id),
        "plan_code": plan.code,
        "plan_name": plan.name,
        "trial_days": subscription_crud.TRIAL_DAYS,
        "start_date": sub.start_date.isoformat() if sub.start_date else None,
        "end_date": sub.end_date.isoformat() if sub.end_date else None,
        "onboarding": bool(org.onboarding),
    }
    return ApiResponse(
        status=True,
        status_code=200,
        message="Ndovu trial started. A trial invoice was sent to your email.",
        data=data,
    )
