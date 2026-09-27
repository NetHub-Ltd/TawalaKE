"""Organization permission catalog and overrides (OWNER policy)."""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import select

from app.api.deps import SessionDep, AuthUser, get_redis, AsyncRedis
from app.api.rbac_deps import (
    require_permissions,
    purge_staff_rbac_cache,
    purge_org_rbac_cache,
)
from app.core.rbac import (
    Permission,
    OverrideEffect,
    catalog_with_roles,
    effective_role,
    role_permission_set,
    ROLE_PERMISSIONS,
)
from app.models.models import (
    Staff,
    StaffRole,
    OrganizationPermissionOverride,
    StaffPermissionOverride,
)
from app.schemas.schemas import ApiResponse

router = APIRouter()


class PermissionCatalogItem(BaseModel):
    code: str
    group: str
    label: str
    description: str
    resources: List[str]
    default_roles: List[str]


class OrgOverrideItem(BaseModel):
    permission_code: str
    effect: str = "DENY"


class OrgOverridesPut(BaseModel):
    """Replace org DENY list. Only DENY is accepted at org level."""

    denies: List[str] = Field(default_factory=list)


class StaffOverrideItem(BaseModel):
    permission_code: str
    effect: str  # DENY | GRANT


class StaffOverridesPut(BaseModel):
    overrides: List[StaffOverrideItem] = Field(default_factory=list)


def _require_owner(user: Staff) -> None:
    if effective_role(user) != StaffRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "OWNER_ONLY",
                "message": "Only the organization Owner can manage permission policy",
            },
        )


@router.get(
    "/permissions/catalog",
    response_model=ApiResponse[List[PermissionCatalogItem]],
    dependencies=[Depends(require_permissions(Permission.ORG_READ))],
)
async def get_permission_catalog(user: AuthUser):
    """Plain-language permission catalog for owners and admins."""
    data = [PermissionCatalogItem(**row) for row in catalog_with_roles()]
    return ApiResponse(status=True, status_code=200, message="Catalog", data=data)


@router.get(
    "/permissions/overrides",
    response_model=ApiResponse[List[OrgOverrideItem]],
)
async def get_org_overrides(
    db: SessionDep,
    user: AuthUser,
    _: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    org_id = user.organization_id or user.tenant_id
    if not org_id:
        raise HTTPException(status_code=400, detail="No organization")
    rows = list(
        await db.exec(
            select(OrganizationPermissionOverride).where(
                OrganizationPermissionOverride.organization_id == org_id,
                OrganizationPermissionOverride.deleted_at.is_(None),
            )
        )
    )
    data = [
        OrgOverrideItem(permission_code=r.permission_code, effect=r.effect)
        for r in rows
    ]
    return ApiResponse(status=True, status_code=200, message="Org overrides", data=data)


@router.put(
    "/permissions/overrides",
    response_model=ApiResponse[List[OrgOverrideItem]],
)
async def put_org_overrides(
    body: OrgOverridesPut,
    db: SessionDep,
    user: AuthUser,
    redis: AsyncRedis = Depends(get_redis),
):
    _require_owner(user)
    org_id = user.organization_id or user.tenant_id
    if not org_id:
        raise HTTPException(status_code=400, detail="No organization")

    valid = {p.value for p in Permission}
    denies = []
    for code in body.denies:
        c = str(code).strip()
        if c not in valid:
            raise HTTPException(status_code=400, detail=f"Unknown permission: {c}")
        denies.append(c)
    denies = sorted(set(denies))

    existing = list(
        await db.exec(
            select(OrganizationPermissionOverride).where(
                OrganizationPermissionOverride.organization_id == org_id,
                OrganizationPermissionOverride.deleted_at.is_(None),
            )
        )
    )
    for row in existing:
        await db.delete(row)
    await db.flush()

    out: list[OrganizationPermissionOverride] = []
    for code in denies:
        row = OrganizationPermissionOverride(
            organization_id=org_id,
            permission_code=code,
            effect=OverrideEffect.DENY.value,
        )
        db.add(row)
        out.append(row)
    await db.commit()
    await purge_org_rbac_cache(redis, org_id, db)

    data = [
        OrgOverrideItem(permission_code=r.permission_code, effect=r.effect) for r in out
    ]
    return ApiResponse(status=True, status_code=200, message="Org policy updated", data=data)


@router.get(
    "/staff/{staff_id}/permission-overrides",
    response_model=ApiResponse[dict],
)
async def get_staff_permission_overrides(
    staff_id: UUID,
    db: SessionDep,
    user: AuthUser,
    _: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    org_id = user.organization_id or user.tenant_id
    target = (
        await db.exec(
            select(Staff).where(
                Staff.id == staff_id,
                Staff.organization_id == org_id,
                Staff.deleted_at.is_(None),
            )
        )
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Staff not found")

    role = effective_role(target)
    ceiling = [p.value for p in role_permission_set(role)]
    rows = list(
        await db.exec(
            select(StaffPermissionOverride).where(
                StaffPermissionOverride.staff_id == staff_id,
                StaffPermissionOverride.deleted_at.is_(None),
            )
        )
    )
    org_rows = list(
        await db.exec(
            select(OrganizationPermissionOverride).where(
                OrganizationPermissionOverride.organization_id == org_id,
                OrganizationPermissionOverride.deleted_at.is_(None),
            )
        )
    )
    return ApiResponse(
        status=True,
        status_code=200,
        message="Staff overrides",
        data={
            "staff_id": str(staff_id),
            "role": role.value if role else None,
            "role_permissions": ceiling,
            "org_denies": [r.permission_code for r in org_rows if r.effect == "DENY"],
            "overrides": [
                {"permission_code": r.permission_code, "effect": r.effect} for r in rows
            ],
        },
    )


@router.put(
    "/staff/{staff_id}/permission-overrides",
    response_model=ApiResponse[dict],
)
async def put_staff_permission_overrides(
    staff_id: UUID,
    body: StaffOverridesPut,
    db: SessionDep,
    user: AuthUser,
    redis: AsyncRedis = Depends(get_redis),
):
    _require_owner(user)
    org_id = user.organization_id or user.tenant_id
    target = (
        await db.exec(
            select(Staff).where(
                Staff.id == staff_id,
                Staff.organization_id == org_id,
                Staff.deleted_at.is_(None),
            )
        )
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Staff not found")

    role = effective_role(target)
    if role == StaffRole.OWNER:
        raise HTTPException(
            status_code=400,
            detail="Owner permissions cannot be overridden",
        )
    ceiling = {p.value for p in role_permission_set(role)}

    valid_effects = {OverrideEffect.DENY.value, OverrideEffect.GRANT.value}
    cleaned: dict[str, str] = {}
    for item in body.overrides:
        code = str(item.permission_code).strip()
        effect = str(item.effect).upper().strip()
        if code not in ceiling:
            raise HTTPException(
                status_code=400,
                detail=f"Permission {code} is outside role {role.value if role else '?'} ceiling",
            )
        if effect not in valid_effects:
            raise HTTPException(status_code=400, detail=f"Invalid effect: {effect}")
        cleaned[code] = effect

    existing = list(
        await db.exec(
            select(StaffPermissionOverride).where(
                StaffPermissionOverride.staff_id == staff_id,
                StaffPermissionOverride.deleted_at.is_(None),
            )
        )
    )
    for row in existing:
        await db.delete(row)
    await db.flush()

    for code, effect in cleaned.items():
        db.add(
            StaffPermissionOverride(
                staff_id=staff_id,
                organization_id=org_id,
                permission_code=code,
                effect=effect,
            )
        )
    await db.commit()
    await purge_staff_rbac_cache(redis, staff_id)

    return ApiResponse(
        status=True,
        status_code=200,
        message="Staff overrides updated",
        data={
            "staff_id": str(staff_id),
            "role": role.value if role else None,
            "overrides": [
                {"permission_code": c, "effect": e} for c, e in sorted(cleaned.items())
            ],
        },
    )
