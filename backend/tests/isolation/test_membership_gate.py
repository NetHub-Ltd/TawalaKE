"""Isolation: membership required for business access (M5)."""

from uuid import uuid4

import pytest

from app.core_platform.organization.service import OrganizationService
from app.core_platform.shared.types import DomainError, DomainErrorCode


@pytest.mark.asyncio
async def test_require_membership_raises_without_row(monkeypatch):
    """Without a DB session implementing scalar, we document the error contract."""
    class FakeSession:
        async def scalar(self, *_a, **_k):
            return None

    svc = OrganizationService(FakeSession())  # type: ignore[arg-type]
    with pytest.raises(DomainError) as ei:
        await svc.require_active_membership(uuid4(), uuid4())
    assert ei.value.code == DomainErrorCode.FORBIDDEN
