"""Membership, roles, permissions, authorization (SPEC M6 + P0 hardening)."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core_platform.security.permissions_seed import SYSTEM_PERMISSIONS
from app.core_platform.shared.types import DomainError, DomainErrorCode, TenantContext
from app.models.security import (
    Membership,
    MembershipRole,
    MembershipStatus,
    Permission,
    Role,
    RolePermission,
    ScopeAssignment,
)


class MembershipService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_active(
        self, user_id: UUID, business_id: UUID
    ) -> Membership | None:
        return await self._session.scalar(
            select(Membership).where(
                Membership.user_id == user_id,
                Membership.business_id == business_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.deleted_at.is_(None),  # type: ignore[attr-defined]
            )
        )

    async def invite(
        self, business_id: UUID, user_id: UUID, *, actor_id: UUID
    ) -> Membership:
        existing = await self._session.scalar(
            select(Membership).where(
                Membership.business_id == business_id,
                Membership.user_id == user_id,
            )
        )
        if existing and existing.status not in (
            MembershipStatus.REVOKED,
            MembershipStatus.SUSPENDED,
        ):
            raise DomainError(DomainErrorCode.CONFLICT, "Membership already exists")
        if existing:
            existing.status = MembershipStatus.INVITED
            existing.invited_at = datetime.now(UTC)
            existing.revoked_at = None
            existing.touch()
            self._session.add(existing)
            await self._session.commit()
            await self._session.refresh(existing)
            return existing
        m = Membership(
            id=uuid4(),
            business_id=business_id,
            user_id=user_id,
            status=MembershipStatus.INVITED,
            invited_at=datetime.now(UTC),
        )
        self._session.add(m)
        await self._session.flush()
        from app.core_platform.shared.activity import record_activity

        await record_activity(
            self._session,
            action="security.membership.invite",
            event_type="membership.invited",
            resource_type="membership",
            resource_id=m.id,
            business_id=business_id,
            actor_user_id=actor_id,
            after={"user_id": str(user_id), "status": m.status.value},
            commit=False,
        )
        await self._session.commit()
        await self._session.refresh(m)
        return m

    async def activate(self, membership_id: UUID) -> Membership:
        m = await self._session.get(Membership, membership_id)
        if m is None or m.deleted_at is not None:
            raise DomainError(DomainErrorCode.NOT_FOUND, "Membership not found")
        if m.status == MembershipStatus.REVOKED:
            raise DomainError(DomainErrorCode.CONFLICT, "Cannot activate revoked membership")
        m.status = MembershipStatus.ACTIVE
        m.activated_at = datetime.now(UTC)
        m.touch()
        self._session.add(m)
        await self._session.commit()
        await self._session.refresh(m)
        return m

    async def suspend(
        self, membership_id: UUID, *, actor_user_id: UUID | None = None
    ) -> Membership:
        m = await self._session.get(Membership, membership_id)
        if m is None:
            raise DomainError(DomainErrorCode.NOT_FOUND, "Membership not found")
        before = {"status": m.status.value}
        m.status = MembershipStatus.SUSPENDED
        m.touch()
        self._session.add(m)
        await self._session.flush()
        from app.core_platform.shared.activity import record_activity

        await record_activity(
            self._session,
            action="security.membership.suspend",
            event_type="membership.suspended",
            resource_type="membership",
            resource_id=m.id,
            business_id=m.business_id,
            actor_user_id=actor_user_id,
            before=before,
            after={"status": m.status.value},
            commit=False,
        )
        await self._session.commit()
        await self._session.refresh(m)
        return m

    async def revoke(
        self, membership_id: UUID, *, actor_user_id: UUID | None = None
    ) -> Membership:
        from app.core_platform.audit.service import AuditService
        from app.core_platform.events.service import EventService
        from app.models.audit import AuditOutcome

        m = await self._session.get(Membership, membership_id)
        if m is None:
            raise DomainError(DomainErrorCode.NOT_FOUND, "Membership not found")
        before = {"status": m.status.value}
        m.status = MembershipStatus.REVOKED
        m.revoked_at = datetime.now(UTC)
        m.touch()
        self._session.add(m)
        await self._session.flush()
        await AuditService(self._session).record(
            action="security.membership.revoke",
            resource_type="membership",
            resource_id=m.id,
            business_id=m.business_id,
            actor_user_id=actor_user_id,
            outcome=AuditOutcome.SUCCESS,
            before=before,
            after={"status": m.status.value},
            commit=False,
        )
        await EventService(self._session).emit(
            event_type="membership.revoked",
            aggregate_type="membership",
            aggregate_id=m.id,
            business_id=m.business_id,
            actor_user_id=actor_user_id,
            payload={"membership_id": str(m.id), "user_id": str(m.user_id)},
            commit=False,
        )
        await self._session.commit()
        await self._session.refresh(m)
        return m

    async def list_for_business(self, business_id: UUID) -> list[Membership]:
        result = await self._session.scalars(
            select(Membership).where(
                Membership.business_id == business_id,
                Membership.deleted_at.is_(None),  # type: ignore[attr-defined]
            )
        )
        return list(result.all())


class RoleService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def ensure_system_permissions(self) -> None:
        for code, description in SYSTEM_PERMISSIONS:
            existing = await self._session.scalar(
                select(Permission).where(Permission.code == code)
            )
            if existing is None:
                self._session.add(
                    Permission(id=uuid4(), code=code, description=description)
                )
        await self._session.commit()

    async def create_role(
        self, business_id: UUID, name: str, *, is_system: bool = False
    ) -> Role:
        role = Role(id=uuid4(), business_id=business_id, name=name, is_system=is_system)
        self._session.add(role)
        await self._session.commit()
        await self._session.refresh(role)
        return role

    async def attach_permission(self, role_id: UUID, permission_code: str) -> None:
        perm = await self._session.scalar(
            select(Permission).where(Permission.code == permission_code)
        )
        if perm is None:
            raise DomainError(DomainErrorCode.NOT_FOUND, f"Permission {permission_code}")
        existing = await self._session.get(RolePermission, (role_id, perm.id))
        if existing:
            return
        self._session.add(RolePermission(role_id=role_id, permission_id=perm.id))
        await self._session.commit()

    async def assign_role(
        self,
        membership_id: UUID,
        role_id: UUID,
        *,
        actor_user_id: UUID | None = None,
        business_id: UUID | None = None,
    ) -> None:
        existing = await self._session.get(MembershipRole, (membership_id, role_id))
        if existing:
            return
        self._session.add(MembershipRole(membership_id=membership_id, role_id=role_id))
        await self._session.flush()
        from app.core_platform.shared.activity import record_activity

        await record_activity(
            self._session,
            action="security.role.assign",
            event_type="role.assigned",
            resource_type="membership",
            resource_id=membership_id,
            business_id=business_id,
            actor_user_id=actor_user_id,
            after={"role_id": str(role_id)},
            commit=False,
        )
        await self._session.commit()

    async def bootstrap_owner(
        self, business_id: UUID, membership_id: UUID
    ) -> Role:
        """Create system Owner role with all Core permissions for a new business."""
        await self.ensure_system_permissions()
        role = Role(
            id=uuid4(),
            business_id=business_id,
            name="Owner",
            is_system=True,
        )
        self._session.add(role)
        await self._session.flush()
        perms = (
            await self._session.scalars(select(Permission))
        ).all()
        for perm in perms:
            self._session.add(
                RolePermission(role_id=role.id, permission_id=perm.id)
            )
        self._session.add(
            MembershipRole(membership_id=membership_id, role_id=role.id)
        )
        await self._session.commit()
        await self._session.refresh(role)
        return role


class AuthorizationService:
    """Resolve effective permissions and assert access."""

    def __init__(self, session: AsyncSession | None) -> None:
        self._session = session

    async def effective_permissions(self, membership_id: UUID) -> frozenset[str]:
        assert self._session is not None
        role_ids = (
            await self._session.scalars(
                select(MembershipRole.role_id).where(
                    MembershipRole.membership_id == membership_id
                )
            )
        ).all()
        if not role_ids:
            return frozenset()
        perm_ids = (
            await self._session.scalars(
                select(RolePermission.permission_id).where(
                    RolePermission.role_id.in_(role_ids)
                )
            )
        ).all()
        if not perm_ids:
            return frozenset()
        codes = (
            await self._session.scalars(
                select(Permission.code).where(Permission.id.in_(perm_ids))
            )
        ).all()
        return frozenset(codes)

    async def build_tenant_context(
        self,
        *,
        user_id: UUID,
        business_id: UUID,
        request_id: UUID,
        branch_id: UUID | None = None,
        location_id: UUID | None = None,
    ) -> TenantContext:
        assert self._session is not None
        m = await self._session.scalar(
            select(Membership).where(
                Membership.user_id == user_id,
                Membership.business_id == business_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.deleted_at.is_(None),  # type: ignore[attr-defined]
            )
        )
        if m is None:
            raise DomainError(
                DomainErrorCode.FORBIDDEN, "No active membership for this business"
            )
        scopes = list(
            (
                await self._session.scalars(
                    select(ScopeAssignment).where(
                        ScopeAssignment.membership_id == m.id,
                        ScopeAssignment.deleted_at.is_(None),  # type: ignore[attr-defined]
                    )
                )
            ).all()
        )
        if scopes:
            allowed_branches = {s.branch_id for s in scopes if s.branch_id}
            allowed_locations = {s.location_id for s in scopes if s.location_id}
            if branch_id and allowed_branches and branch_id not in allowed_branches:
                raise DomainError(DomainErrorCode.FORBIDDEN, "Branch out of scope")
            if location_id and allowed_locations and location_id not in allowed_locations:
                raise DomainError(DomainErrorCode.FORBIDDEN, "Location out of scope")
        perms = await self.effective_permissions(m.id)
        return TenantContext(
            business_id=business_id,
            actor_user_id=user_id,
            membership_id=m.id,
            request_id=request_id,
            permissions=perms,
            branch_id=branch_id,
            location_id=location_id,
        )

    def require_permission(self, ctx: TenantContext, code: str) -> None:
        if code not in ctx.permissions:
            raise DomainError(
                DomainErrorCode.FORBIDDEN, f"Missing permission: {code}"
            )
