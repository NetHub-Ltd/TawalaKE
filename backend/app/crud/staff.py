"""Staff domain CRUD — single owner of staff identity, membership, assignments, and activity.

All staff management HTTP handlers must call into this module.
Onboarding (pending OWNER) also lives here so staff creation is not split across modules.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Type
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy.orm import selectinload
from sqlmodel import col, func, select
from sqlmodel.ext.asyncio.session import AsyncSession
from redis.asyncio.client import Redis as AsyncRedis

from app.core.rbac import Permission, effective_role, has_permission
from app.core.security import security
from app.crud.base import BaseCRUD
from app.models.audit import AuditEvent
from app.models.models import (
    Business,
    Organization,
    Staff,
    StaffBusinessAssignment,
    StaffRole,
)
from app.schemas.schemas import MiniStoreResponse, StaffResponse
from app.schemas.staff import StaffCreate, StaffOnboard, StaffUpdate
from app.schemas.staff_mgmt import (
    StaffBusinessesIn,
    StaffCreateManagedIn,
    StaffResetPasswordIn,
    StaffUpdateIn,
)
from app.services.audit import record_audit
from app.services.paywall import paywall as paywall_service, LIMIT_STAFF
from app.utils.logging import logger


class StaffCrud(BaseCRUD[Staff, StaffCreate, StaffUpdate]):
    def __init__(self, model: Type[Staff]):
        super().__init__(model)

    # ------------------------------------------------------------------
    # Guards
    # ------------------------------------------------------------------
    def role_val(self, staff: Staff) -> StaffRole:
        r = effective_role(staff)
        if r is None:
            raise HTTPException(403, detail="Unknown actor role")
        return r

    def assert_same_org(self, actor: Staff, target: Staff) -> None:
        if actor.organization_id and target.organization_id:
            if actor.organization_id != target.organization_id:
                raise HTTPException(
                    403,
                    detail={
                        "code": "RBAC_DENIED",
                        "message": "Cross-org staff access denied",
                    },
                )

    def assert_can_manage_target(self, actor: Staff, target: Staff) -> None:
        actor_role = self.role_val(actor)
        target_role = effective_role(target)
        self.assert_same_org(actor, target)
        if target_role == StaffRole.OWNER and actor_role != StaffRole.OWNER:
            raise HTTPException(
                403,
                detail={
                    "code": "RBAC_DENIED",
                    "message": "Only an OWNER may modify OWNER accounts",
                },
            )

    async def count_owners(self, db: AsyncSession, organization_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Staff)
            .where(Staff.organization_id == organization_id)
            .where(Staff.role == StaffRole.OWNER)
            .where(Staff.active == True)  # noqa: E712
            .where(Staff.deleted_at.is_(None))
        )
        return int((await db.exec(stmt)).one() or 0)

    # ------------------------------------------------------------------
    # Serialization
    # ------------------------------------------------------------------
    async def to_response(self, db: AsyncSession, staff: Staff) -> StaffResponse:
        stmt = (
            select(Staff)
            .where(Staff.id == staff.id)
            .options(selectinload(Staff.assigned_businesses))
        )
        row = (await db.exec(stmt)).unique().first()
        if not row:
            raise HTTPException(404, detail="Staff not found")
        stores = [
            MiniStoreResponse(id=b.id, name=b.name)
            for b in (row.assigned_businesses or [])
        ]
        return StaffResponse(
            id=row.id,
            organization_id=row.organization_id,
            email=row.email,
            full_name=row.full_name,
            role=row.role,
            active=row.active,
            assigned_businesses=stores,
        )

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------
    async def get_in_org(
        self, db: AsyncSession, staff_id: UUID, organization_id: UUID
    ) -> Staff:
        stmt = select(Staff).where(Staff.id == staff_id)
        target = (await db.exec(stmt)).first()
        if not target or target.deleted_at is not None:
            raise HTTPException(404, detail="Staff not found")
        if target.organization_id != organization_id:
            raise HTTPException(
                403,
                detail={
                    "code": "RBAC_DENIED",
                    "message": "Cross-org staff access denied",
                },
            )
        return target

    async def list_org_staff(
        self, db: AsyncSession, organization_id: UUID
    ) -> List[StaffResponse]:
        stmt = (
            select(Staff)
            .where(Staff.organization_id == organization_id)
            .where(Staff.deleted_at.is_(None))
            .options(selectinload(Staff.assigned_businesses))
            .order_by(Staff.full_name)
        )
        rows = (await db.exec(stmt)).unique().all()
        out: List[StaffResponse] = []
        for s in rows:
            out.append(await self.to_response(db, s))
        return out

    async def list_activity(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        staff_id: Optional[UUID] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Staff-related audit events for an org (optional filter by resource staff id)."""
        stmt = (
            select(AuditEvent)
            .where(AuditEvent.organization_id == organization_id)
            .where(AuditEvent.resource_type == "staff")
            .order_by(col(AuditEvent.created_at).desc())
            .limit(min(max(limit, 1), 200))
        )
        if staff_id is not None:
            stmt = stmt.where(AuditEvent.resource_id == str(staff_id))
        rows = (await db.exec(stmt)).all()
        return [
            {
                "id": str(r.id),
                "action": r.action,
                "outcome": r.outcome,
                "actor_staff_id": str(r.actor_staff_id) if r.actor_staff_id else None,
                "actor_email": r.actor_email,
                "actor_role": r.actor_role,
                "resource_id": r.resource_id,
                "meta": r.meta or {},
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------
    async def create_managed(
        self,
        db: AsyncSession,
        *,
        actor: Staff,
        payload: StaffCreateManagedIn,
        redis: Optional[AsyncRedis] = None,
    ) -> StaffResponse:
        actor_role = self.role_val(actor)
        if payload.role == StaffRole.OWNER and actor_role != StaffRole.OWNER:
            raise HTTPException(
                403,
                detail={
                    "code": "RBAC_DENIED",
                    "message": "Only OWNER may create OWNER",
                },
            )

        org_id = actor.organization_id or getattr(actor, "tenant_id", None)
        if not org_id:
            raise HTTPException(403, detail="Invalid organization")
        if payload.organization_id and str(payload.organization_id) != str(org_id):
            raise HTTPException(
                403,
                detail={
                    "code": "RBAC_DENIED",
                    "message": "Cannot create staff in another organization",
                },
            )

        await paywall_service.enforce_create_staff(db, org_id, redis=redis)

        existing = (
            await db.exec(select(Staff).where(Staff.email == payload.email))
        ).first()
        if existing:
            raise HTTPException(400, detail="Email already registered")

        for bid in payload.business_ids:
            biz = (await db.exec(select(Business).where(Business.id == bid))).first()
            if not biz or biz.organization_id != org_id:
                raise HTTPException(400, detail=f"Business {bid} not in organization")

        staff = Staff(
            id=uuid4(),
            tenant_id=org_id,
            organization_id=org_id,
            email=str(payload.email),
            full_name=payload.full_name,
            hashed_password=None,
            role=payload.role,
            active=False,
        )
        db.add(staff)
        await db.flush()

        for bid in payload.business_ids:
            db.add(
                StaffBusinessAssignment(
                    id=uuid4(),
                    staff_id=staff.id,
                    business_id=bid,
                    organization_id=org_id,
                    role=payload.role,
                )
            )

        await paywall_service.bump_usage(db, org_id, LIMIT_STAFF, redis=redis)
        await db.commit()
        await db.refresh(staff)
        if redis is not None:
            from app.api.rbac_deps import purge_staff_rbac_cache

            await purge_staff_rbac_cache(redis, staff.id)
        await record_audit(
            actor=actor,
            action="staff.create",
            resource_type="staff",
            resource_id=staff.id,
            organization_id=org_id,
            meta={
                "role": payload.role.value,
                "email": str(payload.email),
                "invite": True,
            },
            independent=True,
        )
        return await self.to_response(db, staff)

    def is_pending_invite(self, staff: Staff) -> bool:
        """Pending invite: inactive and no password set."""
        return (not bool(staff.active)) and (not staff.hashed_password)

    async def issue_staff_invite_token(
        self,
        *,
        staff: Staff,
        redis: AsyncRedis,
    ) -> str:
        if not self.is_pending_invite(staff):
            raise HTTPException(
                400,
                detail="Invite can only be sent for pending staff who have not set a password yet.",
            )
        return await security.create_staff_invite_token(
            staff_id=staff.id,
            redis_client=redis,
        )

    async def resend_invite(
        self,
        db: AsyncSession,
        *,
        actor: Staff,
        staff_id: UUID,
        redis: AsyncRedis,
    ) -> StaffResponse:
        """Resend gated by caller permission (ORG_STAFF_MANAGE), not ADMIN role."""
        if not actor.organization_id:
            raise HTTPException(400, detail="Actor has no organization")
        target = await self.get_in_org(db, staff_id, actor.organization_id)
        self.assert_can_manage_target(actor, target)
        if not self.is_pending_invite(target):
            raise HTTPException(
                400,
                detail="Only pending invites can be resent. This member already has an active account.",
            )
        await record_audit(
            actor=actor,
            action="staff.invite_resend",
            resource_type="staff",
            resource_id=target.id,
            organization_id=actor.organization_id,
            meta={"email": target.email},
            independent=True,
        )
        return await self.to_response(db, target)

    async def accept_invite(
        self,
        db: AsyncSession,
        *,
        staff_id: UUID | str,
        new_password: str,
        redis: Optional[AsyncRedis] = None,
    ) -> Staff:
        sid = staff_id if isinstance(staff_id, UUID) else UUID(str(staff_id))
        stmt = select(Staff).where(Staff.id == sid)
        staff = (await db.exec(stmt)).first()
        if not staff or staff.deleted_at is not None:
            raise HTTPException(400, detail="Invalid or expired invite link.")
        if staff.hashed_password and staff.active:
            raise HTTPException(
                400,
                detail="This invite was already accepted. Please sign in.",
            )
        staff.hashed_password = security.hash_password(new_password)
        staff.active = True
        db.add(staff)
        await db.commit()
        await db.refresh(staff)
        if redis is not None:
            from app.api.rbac_deps import purge_staff_rbac_cache

            await purge_staff_rbac_cache(redis, staff.id)
        logger.info(f"Staff invite accepted for {staff.id}")
        return staff

    async def update_managed(
        self,
        db: AsyncSession,
        *,
        actor: Staff,
        staff_id: UUID,
        payload: StaffUpdateIn,
        redis: Optional[AsyncRedis] = None,
    ) -> StaffResponse:
        org_id = actor.organization_id
        if not org_id:
            raise HTTPException(403, detail="Invalid organization")
        target = await self.get_in_org(db, staff_id, org_id)
        self.assert_can_manage_target(actor, target)

        actor_role = self.role_val(actor)
        if payload.role is not None:
            if payload.role == StaffRole.OWNER and actor_role != StaffRole.OWNER:
                raise HTTPException(
                    403,
                    detail={
                        "code": "RBAC_DENIED",
                        "message": "Only OWNER may promote to OWNER",
                    },
                )
            if (
                effective_role(target) == StaffRole.OWNER
                and payload.role != StaffRole.OWNER
                and await self.count_owners(db, org_id) <= 1
            ):
                raise HTTPException(
                    400,
                    detail="Cannot demote the last active OWNER",
                )
            target.role = payload.role

        if payload.full_name is not None:
            target.full_name = payload.full_name

        if payload.active is not None:
            if (
                effective_role(target) == StaffRole.OWNER
                and payload.active is False
                and await self.count_owners(db, org_id) <= 1
            ):
                raise HTTPException(
                    400,
                    detail="Cannot deactivate the last active OWNER",
                )
            target.active = payload.active

        db.add(target)
        await db.commit()
        if redis is not None:
            from app.api.rbac_deps import purge_staff_rbac_cache

            await purge_staff_rbac_cache(redis, staff_id)
        await record_audit(
            actor=actor,
            action="staff.update",
            resource_type="staff",
            resource_id=staff_id,
            organization_id=org_id,
            meta=payload.model_dump(exclude_unset=True),
            independent=True,
        )
        return await self.to_response(db, target)

    async def set_businesses(
        self,
        db: AsyncSession,
        *,
        actor: Staff,
        staff_id: UUID,
        payload: StaffBusinessesIn,
        redis: Optional[AsyncRedis] = None,
    ) -> StaffResponse:
        org_id = actor.organization_id
        if not org_id:
            raise HTTPException(403, detail="Invalid organization")
        target = await self.get_in_org(db, staff_id, org_id)
        self.assert_can_manage_target(actor, target)

        for bid in payload.business_ids:
            biz = (await db.exec(select(Business).where(Business.id == bid))).first()
            if not biz or biz.organization_id != org_id:
                raise HTTPException(400, detail=f"Business {bid} not in organization")

        existing = (
            await db.exec(
                select(StaffBusinessAssignment).where(
                    StaffBusinessAssignment.staff_id == staff_id
                )
            )
        ).all()
        for row in existing:
            await db.delete(row)
        await db.flush()

        for bid in payload.business_ids:
            db.add(
                StaffBusinessAssignment(
                    id=uuid4(),
                    staff_id=staff_id,
                    business_id=bid,
                    organization_id=org_id,
                    role=target.role,
                )
            )
        await db.commit()
        if redis is not None:
            from app.api.rbac_deps import purge_staff_rbac_cache

            await purge_staff_rbac_cache(redis, staff_id)
        await record_audit(
            actor=actor,
            action="staff.assign_businesses",
            resource_type="staff",
            resource_id=staff_id,
            organization_id=org_id,
            meta={"business_ids": [str(b) for b in payload.business_ids]},
            independent=True,
        )
        return await self.to_response(db, target)

    async def reset_password(
        self,
        db: AsyncSession,
        *,
        actor: Staff,
        staff_id: UUID,
        payload: StaffResetPasswordIn,
    ) -> None:
        org_id = actor.organization_id
        if not org_id:
            raise HTTPException(403, detail="Invalid organization")
        target = await self.get_in_org(db, staff_id, org_id)
        self.assert_can_manage_target(actor, target)
        target.hashed_password = security.hash_password(payload.password)
        db.add(target)
        await db.commit()
        await record_audit(
            actor=actor,
            action="staff.reset_password",
            resource_type="staff",
            resource_id=staff_id,
            organization_id=target.organization_id,
            meta={},
            independent=True,
        )

    # ------------------------------------------------------------------
    # Onboarding (first OWNER) — still staff domain
    # ------------------------------------------------------------------
    async def onboard_staff(self, db: AsyncSession, payload: StaffOnboard):
        stmt = select(self.model).where(self.model.email == payload.email)
        result = (await db.exec(stmt)).first()
        if result:
            raise HTTPException(
                status_code=409, detail=f"A user with {payload.email} exist"
            )
        local_part = payload.email.split("@", 1)[0].strip().lower()
        org = Organization(
            name=f"{local_part}-workspace",
            email=payload.email,
        )
        db.add(org)
        await db.flush()
        await db.refresh(org)

        create_payload = {
            "email": payload.email,
            "full_name": payload.full_name,
            "tenant_id": org.id,
            "organization_id": org.id,
            "role": StaffRole.OWNER,
            "active": False,
            "hashed_password": None,
        }
        if getattr(payload, "phone", None):
            create_payload["phone"] = payload.phone

        staff = await self.create(db=db, obj_in=create_payload)
        await db.commit()

        reload_stmt = (
            select(self.model)
            .where(self.model.id == staff.id)
            .options(selectinload(self.model.assigned_businesses))
        )
        staff = (await db.exec(reload_stmt)).first()
        if staff is not None and staff.assigned_businesses is None:
            staff.assigned_businesses = []

        logger.info(
            f"Created pending Staff: {staff.id} for Org: {staff.organization_id} (active=False)"
        )
        return staff


staff_crud = StaffCrud(Staff)
