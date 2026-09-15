"""Dependencies for ecosystem hard-session auth (M1)."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.hard_session import (
    HardSessionError,
    HardSessionPrincipal,
    verify_hard_session_token,
)

_bearer = HTTPBearer(auto_error=False)


async def get_hard_session_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> HardSessionPrincipal:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return verify_hard_session_token(credentials.credentials)
    except HardSessionError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.detail,
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


HardSessionUser = Annotated[HardSessionPrincipal, Depends(get_hard_session_principal)]
