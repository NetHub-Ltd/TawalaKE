"""Platform identity and administration APIs (Slice A).

Separate from tenant Staff. Requires JWT with kind=platform.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import select

from app.api.deps import SessionDep
from app.api.platform_deps import (
    PlatformAuthUser,
    get_current_platform_user,
    require_platform_permissions,
)
from app.core.config import settings
from app.core.platform_rbac import (
    PlatformPermission,
    effective_platform_role,
    permissions_for,
)
from app.core.security import security
from app.models.models import PlatformRole, PlatformUser
from app.schemas.platform import (
    PlatformLoginRequest,
    PlatformMeResponse,
    PlatformTokenResponse,
    PlatformUserCreate,
    PlatformUserRead,
    PlatformUserUpdate,
)
from app.services.audit import record_platform_audit
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
) -> PlatformUserRead:
    """Create a platform user. SUPER_ADMIN only via USERS_WRITE."""
    email = body.email.strip().lower()
    existing = (
        await db.exec(select(PlatformUser).where(PlatformUser.email == email))
    ).first()
    if existing and existing.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A platform user with this email already exists",
        )

    # Only SUPER_ADMIN may create another SUPER_ADMIN
    actor_role = effective_platform_role(actor)
    if body.role == PlatformRole.SUPER_ADMIN and actor_role != PlatformRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SUPER_ADMIN can create SUPER_ADMIN users",
        )

    user = PlatformUser(
        email=email,
        full_name=body.full_name.strip(),
        hashed_password=security.hash_password(body.password),
        role=body.role,
        active=body.active,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await record_platform_audit(
        db,
        actor=actor,
        action="platform.users.create",
        outcome="success",
        resource_type="platform_user",
        resource_id=user.id,
        meta={"email": user.email, "role": user.role.value},
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
