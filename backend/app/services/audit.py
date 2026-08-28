"""Best-effort staff audit logging (who / what / when)."""
from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.models import Staff
from app.models.audit import AuditEvent
from app.core.rbac import effective_role
from app.core.session import AsyncSessionLocal
from app.core.config import settings
from app.utils.logging import logger


async def record_audit(
    db: Optional[AsyncSession] = None,
    *,
    actor: Optional[Staff],
    action: str,
    outcome: str = "success",
    resource_type: Optional[str] = None,
    resource_id: Optional[UUID | str] = None,
    organization_id: Optional[UUID] = None,
    business_id: Optional[UUID] = None,
    meta: Optional[dict[str, Any]] = None,
    request_id: Optional[str] = None,
    independent: bool = False,
) -> None:
    """
    Persist an audit event.

    independent=True opens its own session/commit (use for 403 paths so the
    event survives request rollback). Failures are logged and swallowed (v1).
    """
    if not getattr(settings, "audit_enabled", True):
        return

    role = effective_role(actor) if actor else None
    payload = dict(
        actor_staff_id=actor.id if actor else None,
        actor_email=(actor.email if actor else None),
        actor_role=(role.value if role else None),
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        organization_id=organization_id
        or (getattr(actor, "organization_id", None) if actor else None),
        business_id=business_id,
        outcome=outcome,
        meta=meta or {},
        request_id=request_id,
    )

    try:
        if independent or db is None:
            async with AsyncSessionLocal() as session:
                session.add(AuditEvent(**payload))
                await session.commit()
            return

        db.add(AuditEvent(**payload))
        await db.flush()
    except Exception as exc:  # noqa: BLE001
        logger.error(f"audit write failed action={action} outcome={outcome}: {exc}")
