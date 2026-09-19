"""Audit list route (SPEC F.7)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core_platform.audit.service import AuditService
from app.core_platform.organization.service import OrganizationService
from app.core_platform.shared.types import DomainError, DomainErrorCode
from app.db.session import get_session
from app.models.identity import User
from app.schemas.audit import AuditRecordRead

router = APIRouter(prefix="/api/v1", tags=["audit"])


def _map(exc: DomainError) -> HTTPException:
    status = {
        DomainErrorCode.FORBIDDEN: 403,
        DomainErrorCode.NOT_FOUND: 404,
    }.get(exc.code, 400)
    return HTTPException(status_code=status, detail=exc.message)


@router.get("/audit-records", response_model=list[AuditRecordRead])
async def list_audit_records(
    business_id: UUID = Query(...),
    limit: int = Query(100, ge=1, le=500),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[AuditRecordRead]:
    try:
        await OrganizationService(session).require_active_membership(
            user.id, business_id
        )
        rows = await AuditService(session).list_for_business(business_id, limit=limit)
    except DomainError as exc:
        raise _map(exc) from exc
    return [AuditRecordRead.model_validate(r) for r in rows]
