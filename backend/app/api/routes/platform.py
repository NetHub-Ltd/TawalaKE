"""Platform identity and administration APIs (Slice A).

Separate from tenant Staff. Requires JWT with kind=platform.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List
from uuid import UUID

import secrets

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlmodel import select

from app.api.deps import SessionDep
from app.api.platform_deps import (
    PlatformAuthUser,
    get_current_platform_user,
    require_platform_permissions,
)
from app.core.config import settings
from app.core.mailer import mailer
from app.core.platform_rbac import (
    PlatformPermission,
    effective_platform_role,
    permissions_for,
)
from app.core.security import security
from app.models.models import Organization, PlatformRole, PlatformUser
from app.schemas.platform import (
    PlatformLoginRequest,
    PlatformMeResponse,
    PlatformOrgHardDeleteRequest,
    PlatformOrgHardDeleteResponse,
    PlatformOrgRead,
    PlatformTokenResponse,
    PlatformChangePasswordRequest,
    PlatformUserCreate,
    PlatformUserRead,
    PlatformUserUpdate,
)
from app.services.audit import record_platform_audit
from app.services.platform_org_delete import hard_delete_organization
from app.core.redis_client import limiter
from app.utils.logging import logger

router = APIRouter()


@router.post("/auth/login", response_model=PlatformTokenResponse)
async def platform_login(
    request: Request,
    body: PlatformLoginRequest,
    db: SessionDep,
) -> PlatformTokenResponse:
    """
    Authenticate a platform user (email + password).

    Returns a short-lived access token with kind=platform.
    Does not set tenant refresh cookies.
    """
    email = body.email.strip().lower()
    stmt = select(PlatformUser).where(PlatformUser.email == email)
    user = (await db.exec(stmt)).first()
    if (
        not user
        or not user.active
        or user.deleted_at is not None
        or not user.hashed_password
        or not security.verify_password(body.password, user.hashed_password)
    ):
        await record_platform_audit(
            db,
            actor=None,
            action="platform.auth.login",
            outcome="denied",
            resource_type="platform_user",
            meta={"email": email},
            request_id=request.headers.get("x-request-id"),
            independent=True,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    role = effective_platform_role(user)
    role_value = role.value if role else PlatformRole.SUPPORT.value
    perms = [p.value for p in permissions_for(user)]
    token = security.create_platform_access_token(
        user_id=str(user.id),
        role=role_value,
        scopes=perms,
    )
    user.last_login_at = datetime.now(timezone.utc)
    db.add(user)
    await db.commit()

    await record_platform_audit(
        db,
        actor=user,
        action="platform.auth.login",
        outcome="success",
        resource_type="platform_user",
        resource_id=user.id,
        request_id=request.headers.get("x-request-id"),
    )

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    logger.info(f"Platform login ok user={user.id} role={role_value}")
    return PlatformTokenResponse(
        access_token=token,
        expires_at=expires_at,
        role=role or PlatformRole.SUPPORT,
        must_change_password=bool(getattr(user, "must_change_password", False)),
    )


@router.post("/auth/change-password", response_model=PlatformMeResponse)
async def platform_change_password(
    request: Request,
    body: PlatformChangePasswordRequest,
    db: SessionDep,
    actor: PlatformAuthUser,
) -> PlatformMeResponse:
    """Change password (required after invite when must_change_password is true)."""
    if body.new_password == body.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )
    if not actor.hashed_password or not security.verify_password(
        body.current_password, actor.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    actor.hashed_password = security.hash_password(body.new_password)
    actor.must_change_password = False
    db.add(actor)
    await db.commit()
    await db.refresh(actor)
    await record_platform_audit(
        db,
        actor=actor,
        action="platform.auth.change_password",
        outcome="success",
        resource_type="platform_user",
        resource_id=actor.id,
        request_id=request.headers.get("x-request-id"),
    )
    return PlatformMeResponse(
        user=PlatformUserRead.model_validate(actor),
        permissions=[p.value for p in permissions_for(actor)],
    )


@router.get("/auth/me", response_model=PlatformMeResponse)
async def platform_me(user: PlatformAuthUser) -> PlatformMeResponse:
    """Return the authenticated platform user and effective permissions."""
    return PlatformMeResponse(
        user=PlatformUserRead.model_validate(user),
        permissions=[p.value for p in permissions_for(user)],
    )


@router.get(
    "/users",
    response_model=List[PlatformUserRead],
    dependencies=[Depends(require_platform_permissions(PlatformPermission.USERS_READ))],
)
async def list_platform_users(
    db: SessionDep,
    user: PlatformAuthUser,
) -> List[PlatformUserRead]:
    """List platform users (active and inactive, exclude soft-deleted)."""
    stmt = (
        select(PlatformUser)
        .where(PlatformUser.deleted_at.is_(None))
        .order_by(PlatformUser.created_at.desc())
    )
    rows = list(await db.exec(stmt))
    return [PlatformUserRead.model_validate(r) for r in rows]


@router.post(
    "/users",
    response_model=PlatformUserRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_platform_permissions(PlatformPermission.USERS_WRITE))],
)
async def create_platform_user(
    request: Request,
    body: PlatformUserCreate,
    db: SessionDep,
    actor: PlatformAuthUser,
    background_tasks: BackgroundTasks,
) -> PlatformUserRead:
    """
    Invite a platform user (email + name only).

    Generates a temporary password, sets must_change_password=True, and emails
    credentials with a platform login button. Client must not supply a password.
    """
    email = body.email.strip().lower()
    existing = (
        await db.exec(select(PlatformUser).where(PlatformUser.email == email))
    ).first()
    if existing and existing.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A platform user with this email already exists",
        )

    actor_role = effective_platform_role(actor)
    if body.role == PlatformRole.SUPER_ADMIN and actor_role != PlatformRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SUPER_ADMIN can create SUPER_ADMIN users",
        )

    temporary_password = secrets.token_urlsafe(18)
    user = PlatformUser(
        email=email,
        full_name=body.full_name.strip(),
        hashed_password=security.hash_password(temporary_password),
        role=body.role,
        active=body.active,
        must_change_password=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    frontend = (settings.frontend_url or "").rstrip("/")
    if frontend and not frontend.startswith("http"):
        frontend = f"https://{frontend}"
    login_url = f"{frontend}/platform/login" if frontend else "/platform/login"

    background_tasks.add_task(
        mailer.send_platform_user_invite,
        to_email=email,
        temporary_password=temporary_password,
        login_url=login_url,
        user_name=user.full_name,
        inviter_name=getattr(actor, "full_name", None) or getattr(actor, "email", None),
    )

    await record_platform_audit(
        db,
        actor=actor,
        action="platform.users.create",
        outcome="success",
        resource_type="platform_user",
        resource_id=user.id,
        meta={
            "email": user.email,
            "role": user.role.value,
            "invite": True,
            "must_change_password": True,
        },
        request_id=request.headers.get("x-request-id"),
    )
    return PlatformUserRead.model_validate(user)


@router.patch(
    "/users/{user_id}",
    response_model=PlatformUserRead,
    dependencies=[Depends(require_platform_permissions(PlatformPermission.USERS_WRITE))],
)
async def update_platform_user(
    request: Request,
    user_id: UUID,
    body: PlatformUserUpdate,
    db: SessionDep,
    actor: PlatformAuthUser,
) -> PlatformUserRead:
    """Update platform user fields. Soft constraints on SUPER_ADMIN elevation."""
    target = (
        await db.exec(
            select(PlatformUser).where(
                PlatformUser.id == user_id,
                PlatformUser.deleted_at.is_(None),
            )
        )
    ).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    actor_role = effective_platform_role(actor)
    data = body.model_dump(exclude_unset=True)

    if "role" in data and data["role"] == PlatformRole.SUPER_ADMIN:
        if actor_role != PlatformRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only SUPER_ADMIN can assign SUPER_ADMIN",
            )

    if "full_name" in data and data["full_name"] is not None:
        target.full_name = data["full_name"].strip()
    if "role" in data and data["role"] is not None:
        target.role = data["role"]
    if "active" in data and data["active"] is not None:
        target.active = data["active"]
    if "password" in data and data["password"]:
        target.hashed_password = security.hash_password(data["password"])
        target.must_change_password = True

    db.add(target)
    await db.commit()
    await db.refresh(target)

    await record_platform_audit(
        db,
        actor=actor,
        action="platform.users.update",
        outcome="success",
        resource_type="platform_user",
        resource_id=target.id,
        meta={"fields": sorted(data.keys())},
        request_id=request.headers.get("x-request-id"),
    )
    return PlatformUserRead.model_validate(target)


# ---------------------------------------------------------------------------
# Organizations (cross-tenant) — issue #297
# ---------------------------------------------------------------------------


@router.get(
    "/organizations",
    response_model=List[PlatformOrgRead],
    dependencies=[Depends(require_platform_permissions(PlatformPermission.ORGS_READ))],
)
async def list_platform_organizations(
    db: SessionDep,
    user: PlatformAuthUser,
    active: bool | None = None,
    q: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> List[PlatformOrgRead]:
    """
    List organizations across all tenants (platform operators only).

    Optional filters: active, q (name/email substring).
    """
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    stmt = select(Organization).order_by(Organization.created_at.desc())
    if active is not None:
        stmt = stmt.where(Organization.active == active)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            (Organization.name.ilike(like)) | (Organization.email.ilike(like))
        )
    stmt = stmt.offset(offset).limit(limit)
    rows = list(await db.exec(stmt))
    return [PlatformOrgRead.model_validate(r) for r in rows]


@router.get(
    "/organizations/{organization_id}",
    response_model=PlatformOrgRead,
    dependencies=[Depends(require_platform_permissions(PlatformPermission.ORGS_READ))],
)
async def get_platform_organization(
    organization_id: UUID,
    db: SessionDep,
    user: PlatformAuthUser,
) -> PlatformOrgRead:
    """Get a single organization by id (any tenant)."""
    org = (
        await db.exec(select(Organization).where(Organization.id == organization_id))
    ).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return PlatformOrgRead.model_validate(org)


@router.delete(
    "/organizations/{organization_id}",
    response_model=PlatformOrgHardDeleteResponse,
    dependencies=[Depends(require_platform_permissions(PlatformPermission.ORGS_WRITE))],
)
@limiter.limit("5/hour")
async def hard_delete_platform_organization(
    request: Request,
    organization_id: UUID,
    body: PlatformOrgHardDeleteRequest,
    db: SessionDep,
    actor: PlatformAuthUser,
) -> PlatformOrgHardDeleteResponse:
    """
    Permanently delete an organization and its org-scoped data.

    Temporary cleanup tool (issue #297). Requires:
    - settings.platform_org_hard_delete == True
    - SUPER_ADMIN role
    - confirm_name exact match and confirm_phrase == \"DELETE\"
    """
    if not settings.platform_org_hard_delete:
        await record_platform_audit(
            db,
            actor=actor,
            action="platform.orgs.hard_delete",
            outcome="denied_flag_off",
            resource_type="organization",
            resource_id=organization_id,
            meta={"reason": body.reason},
            request_id=request.headers.get("x-request-id"),
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "HARD_DELETE_DISABLED",
                "message": (
                    "Platform org hard delete is disabled. "
                    "Set PLATFORM_ORG_HARD_DELETE=true only during a cleanup window."
                ),
            },
        )

    actor_role = effective_platform_role(actor)
    if actor_role != PlatformRole.SUPER_ADMIN:
        await record_platform_audit(
            db,
            actor=actor,
            action="platform.orgs.hard_delete",
            outcome="denied_role",
            resource_type="organization",
            resource_id=organization_id,
            meta={"reason": body.reason, "role": str(actor_role)},
            request_id=request.headers.get("x-request-id"),
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SUPER_ADMIN may hard-delete organizations",
        )

    if body.confirm_phrase.strip() != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "CONFIRM_PHRASE_INVALID",
                "message": 'confirm_phrase must be exactly DELETE',
            },
        )

    org = (
        await db.exec(select(Organization).where(Organization.id == organization_id))
    ).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if org.name.strip() != body.confirm_name.strip():
        await record_platform_audit(
            db,
            actor=actor,
            action="platform.orgs.hard_delete",
            outcome="denied_name_mismatch",
            resource_type="organization",
            resource_id=organization_id,
            meta={
                "reason": body.reason,
                "provided_name": body.confirm_name,
                "actual_name": org.name,
            },
            request_id=request.headers.get("x-request-id"),
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "CONFIRM_NAME_MISMATCH",
                "message": "confirm_name does not match the organization name",
            },
        )

    try:
        result = await hard_delete_organization(db, org_id=organization_id)
    except LookupError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    except Exception as exc:
        logger.exception(
            "platform_org_hard_delete failed org=%s err=%s",
            organization_id,
            type(exc).__name__,
        )
        await record_platform_audit(
            db,
            actor=actor,
            action="platform.orgs.hard_delete",
            outcome="error",
            resource_type="organization",
            resource_id=organization_id,
            meta={"reason": body.reason, "error": type(exc).__name__},
            request_id=request.headers.get("x-request-id"),
            independent=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "HARD_DELETE_FAILED",
                "message": "Organization hard delete failed; see server logs",
            },
        ) from exc

    await record_platform_audit(
        db,
        actor=actor,
        action="platform.orgs.hard_delete",
        outcome="success",
        resource_type="organization",
        resource_id=organization_id,
        meta={
            "reason": body.reason,
            "name": result.get("name"),
            "pre_delete_counts": result.get("pre_delete_counts"),
            "deleted_table_rows": result.get("deleted_table_rows"),
        },
        request_id=request.headers.get("x-request-id"),
        independent=True,
    )
    return PlatformOrgHardDeleteResponse(**result)
