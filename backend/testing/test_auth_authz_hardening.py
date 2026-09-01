"""AuthN/AuthZ hardening: org claim, role scopes, fail-closed business access."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.core.security import SecurityService, ROLE_SCOPES, _resolve_role
from app.models.models import StaffRole


def test_resolve_role_includes_admin():
    assert _resolve_role("ADMIN") == StaffRole.ADMIN
    assert _resolve_role("owner") == StaffRole.OWNER
    assert StaffRole.ADMIN in ROLE_SCOPES
    assert len(ROLE_SCOPES[StaffRole.ADMIN]) > 0


def test_create_tokens_uses_organization_id_claim():
    svc = SecurityService()
    org = str(uuid4())
    tokens = svc.create_tokens(
        {"sub": str(uuid4()), "organization_id": org, "role": "OWNER"}
    )
    assert tokens.access_token
    from jose import jwt
    from app.core.config import settings

    payload = jwt.decode(
        tokens.access_token,
        settings.secret_key,
        algorithms=[settings.algorithm],
        audience=settings.audience,
        issuer=settings.issuer,
    )
    assert payload["organization_id"] == org
    assert payload["type"] == "access"


@pytest.mark.asyncio
async def test_authenticate_prefers_organization_id_over_tenant_id():
    svc = SecurityService()
    org = uuid4()
    tenant = uuid4()
    staff = MagicMock()
    staff.id = uuid4()
    staff.organization_id = org
    staff.tenant_id = tenant
    staff.active = True
    staff.hashed_password = svc.hash_password("Secret123!")
    staff.role = StaffRole.OWNER
    staff.assigned_businesses = []
    staff.email = "owner@test.com"

    db = AsyncMock()
    result = MagicMock()
    result.first = lambda: staff
    db.exec = AsyncMock(return_value=result)

    with patch.object(svc, "verify_password", return_value=True):
        tokens = await svc.authenticate("owner@test.com", "Secret123!", db)

    from jose import jwt
    from app.core.config import settings

    payload = jwt.decode(
        tokens.access_token,
        settings.secret_key,
        algorithms=[settings.algorithm],
        audience=settings.audience,
        issuer=settings.issuer,
    )
    assert payload["organization_id"] == str(org)


def test_jwt_error_message_is_opaque():
    """Client must not receive jose internals."""
    # Covered by static review of verify_token; ensure detail constant exists in source
    from pathlib import Path
    src = Path("app/core/security.py").read_text()
    assert 'detail=f"Invalid authentication token: {str(e)}"' not in src
    assert 'detail="Invalid authentication token"' in src
