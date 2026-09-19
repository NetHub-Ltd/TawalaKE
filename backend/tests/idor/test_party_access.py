"""IDOR: party only visible when linked to caller's business."""

from uuid import uuid4

import pytest

from app.core_platform.parties.service import PartyService
from app.core_platform.shared.types import DomainError, DomainErrorCode


@pytest.mark.asyncio
async def test_get_party_without_link_is_not_found():
    class FakeSession:
        async def scalar(self, *_a, **_k):
            return None

        async def get(self, *_a, **_k):
            return None

    svc = PartyService(FakeSession())  # type: ignore[arg-type]
    with pytest.raises(DomainError) as ei:
        await svc.get_party_for_business(uuid4(), user_id=uuid4(), business_id=uuid4())
    assert ei.value.code in (DomainErrorCode.FORBIDDEN, DomainErrorCode.NOT_FOUND)
