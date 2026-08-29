from fastapi import APIRouter, HTTPException, Request, Depends, BackgroundTasks
from pydantic import BaseModel
from app.api.deps import SessionDep, AuthUser
from app.api.rbac_deps import require_permissions
from app.core.rbac import Permission
from app.models.models import Organization, Tenant, Staff, StaffRole
from uuid import UUID
from sqlmodel import select
from app.crud.organization import organization_crud
from app.schemas.schemas import ApiResponse, BusinessResponse, StaffResponse, OrganizationResponse
from typing import List, Optional, Any
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
from app.api.deps import SessionDep, get_redis, AsyncRedis, universal_key_builder, purge_cache_namespace
from datetime import datetime, timezone
from app.crud import subscription as subscription_crud
from app.services import paywall as paywall_service

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


def _require_owner(user) -> None:
    """Legacy helper — prefer require_permissions(Permission.ORG_BILLING)."""
    from app.core.rbac import has_permission, Permission
    if not has_permission(user, Permission.ORG_BILLING):
        raise HTTPException(
            status_code=403,
            detail={
                "code": "RBAC_DENIED",
                "message": "Only organization owners can perform this action",
                "permissions": ["org:billing"],
            },
        )


# ---------------------------------------------------------------------------
# Static paths MUST be registered before /{organization_id}
# ---------------------------------------------------------------------------


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
async def updates_organization(
    request: Request,
    organization_id: UUID,
    db: SessionDep,
    user: AuthUser,
    payload: OrgUpdate,
    redis_client: AsyncRedis = Depends(get_redis),
):
    from app.core.rbac import has_permission, Permission
    if not has_permission(user, Permission.ORG_WRITE):
        raise HTTPException(
            status_code=403,
            detail={"code": "RBAC_DENIED", "message": "Not authorized", "permissions": ["org:write"]},
        )
    if str(organization_id) != str(user.organization_id) and str(organization_id) != str(
        getattr(user, "tenant_id", None)
    ):
        raise HTTPException(status_code=403, detail="Not Authorized to perform this action!")

    org = await organization_crud.get_organization_by_id(db=db, org_id=organization_id)

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


@router.get("/subscription", response_model=ApiResponse[dict])
async def get_my_subscription(db: SessionDep, user: AuthUser):
    org_id = user.organization_id or user.tenant_id
    if not org_id:
        raise HTTPException(status_code=400, detail="No organization on account")
    sub = await subscription_crud.get_active_subscription(db, org_id)
    if not sub:
        return ApiResponse(
            status=True, status_code=200, message="No active subscription", data=None
        )
    from app.models.models import Plan

    plan_code = plan_name = None
    if sub.plan_id:
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
    return ApiResponse(
        status=True, status_code=200, message="Subscription retrieved", data=data
    )


@router.get("/onboarding-status", response_model=ApiResponse[dict])
async def get_onboarding_status(db: SessionDep, user: AuthUser):
    org_id = user.organization_id or user.tenant_id
    if not org_id:
        raise HTTPException(status_code=400, detail="No organization on account")
    org = await organization_crud.get_organization_by_id(db=db, org_id=org_id)
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
    return ApiResponse(
        status=True, status_code=200, message="Onboarding status", data=data
    )


class TrialStartBody(BaseModel):
    plan_code: str = "NDOVU"


@router.post("/trial/start", response_model=ApiResponse[dict])
async def start_trial(
    db: SessionDep,
    user: AuthUser,
    background_tasks: BackgroundTasks,
    payload: Optional[TrialStartBody] = None,
):
    """OWNER only: start a 7-day trial on BASIC or NDOVU; email zero-amount invoice."""
    _require_owner(user)
    org_id = user.organization_id or user.tenant_id
    if not org_id:
        raise HTTPException(status_code=400, detail="No organization on account")

    org = await organization_crud.get_organization_by_id(db=db, org_id=org_id)
    code = (payload.plan_code if payload else "NDOVU") or "NDOVU"

    sub, plan = await subscription_crud.start_plan_trial(db, org_id, plan_code=code)
    org = await subscription_crud.maybe_mark_onboarding_complete(db, org)

    start_s = sub.start_date.strftime("%Y-%m-%d") if sub.start_date else ""
    end_s = sub.end_date.strftime("%Y-%m-%d") if sub.end_date else ""
    background_tasks.add_task(
        mailer.send_trial_invoice,
        to_email=user.email or org.email,
        org_name=org.name,
        plan_name=plan.name,
        trial_days=int((sub.end_date - sub.start_date).days) if sub.end_date and sub.start_date else subscription_crud.TRIAL_DAYS,
        start_date=start_s,
        end_date=end_s,
        currency=plan.currency or "KES",
    )
    logger.info(f"Trial invoice queued for {user.email}")

    data = {
        "subscription_id": str(sub.id),
        "plan_code": plan.code,
        "plan_name": plan.name,
        "trial_days": int((sub.end_date - sub.start_date).days) if sub.end_date and sub.start_date else subscription_crud.TRIAL_DAYS,
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


@router.post("/new-store", status_code=200, response_model=ApiResponse[StoreResponse])
async def register_new_store(db: SessionDep, payload: StoreCreate, user: AuthUser):
    if user.role != "OWNER" and payload.organization != user.organization_id:
        raise HTTPException(status_code=403, detail="You are not allowed to perform this action")

    org_id = payload.organization or user.organization_id
    if org_id is None:
        raise HTTPException(status_code=400, detail="organization is required")
    await paywall_service.enforce_create_business(db, org_id)

    store = await organization_crud.register_store(db, payload, user)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Store created succesfully",
        data=store,
    )


@router.get("/entitlements", response_model=ApiResponse[dict])
async def get_org_entitlements(db: SessionDep, user: AuthUser):
    """
    Current plan, limits, features, and live usage for the caller's organization.
    Used by billing UI and client-side soft gates.
    """
    org_id = user.organization_id
    if org_id is None:
        raise HTTPException(
            status_code=403,
            detail={"code": "ORG_REQUIRED", "message": "Staff must belong to an organization"},
        )
    snapshot = await paywall_service.get_usage_snapshot(db, org_id)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Entitlements resolved",
        data=snapshot,
    )



@router.get("/stores/{organization_id}", response_model=ApiResponse[List[BusinessResponse]])
@cache(expire=CACHE_TTL_SEC, namespace="stores", key_builder=universal_key_builder)
async def get_businesses_by_tenant(
    organization_id: UUID, db: SessionDep, user: AuthUser, active: bool = True
):
    if organization_id != user.organization_id:
        raise HTTPException(status_code=403, detail="You dont have access to perform this action")

    businesses = await business_crud.get_tenant_businesses(tenant_id=organization_id, db=db)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Businesses retrieved successfully",
        data=businesses,
    )


@router.get("/staff/{organization_id}", response_model=ApiResponse[List[StaffResponse]])
@cache(expire=CACHE_TTL_SEC, namespace="organizations", key_builder=universal_key_builder)
async def get_staff_by_tenant(
    organization_id: UUID, db: SessionDep, user: AuthUser, business_id: UUID = None
):
    staff = await organization_crud.tenant_staff(organization_id, db, business_id=business_id)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Staff retrieved successfully",
        data=staff,
    )


@router.get("/billing/{organization_id}", response_model=ApiResponse[List[BusinessResponse]])
@cache(expire=CACHE_TTL_SEC, namespace="billing", key_builder=universal_key_builder)
async def get_billing_by_tenant(
    organization_id: UUID, db: SessionDep, user: AuthUser, active: bool = True
):
    businesses = await business_crud.get_tenant_businesses(tenant_id=organization_id, db=db)
    return ApiResponse(
        status=True,
        status_code=200,
        message="Businesses retrieved successfully",
        data=businesses,
    )


# Parameterized catch-all for org by id — MUST remain after static paths
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
        data=org,
    )
