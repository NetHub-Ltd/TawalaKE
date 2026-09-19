"""FastAPI dependencies for Core."""

from __future__ import annotations

from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core_platform.identity.service import IdentityService
from app.core_platform.shared.types import DomainError, DomainErrorCode
from app.db.session import get_session
from app.models.identity import User


async def get_identity_service(
    session: AsyncSession = Depends(get_session),
) -> IdentityService:
    return IdentityService(session)


def _bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return authorization.split(" ", 1)[1].strip()


async def get_current_user(
    authorization: str | None = Header(default=None),
    service: IdentityService = Depends(get_identity_service),
) -> User:
    token = _bearer_token(authorization)
    try:
        return await service.resolve_user(token)
    except DomainError as exc:
        if exc.code == DomainErrorCode.UNAUTHORIZED:
            raise HTTPException(status_code=401, detail=exc.message) from exc
        raise HTTPException(status_code=400, detail=exc.message) from exc
