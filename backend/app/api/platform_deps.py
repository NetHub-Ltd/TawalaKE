"""Dependencies for platform-level authentication and authorization."""
from __future__ import annotations

from typing import Annotated, Callable, List

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import SessionDep, get_redis
from redis.asyncio import Redis as AsyncRedis
from app.core.platform_rbac import (
    PlatformPermission,
    effective_platform_role,
    has_all_permissions,
    permissions_for,
)
from app.core.security import security, TokenData
from app.models.models import PlatformUser
from app.services.audit import record_platform_audit
from app.utils.logging import logger

_bearer = HTTPBearer(auto_error=False)


async def get_current_platform_user(
    db: SessionDep,
    redis: AsyncRedis = Depends(get_redis),
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> PlatformUser:
    """
    Authenticate a PlatformUser from a JWT with kind=platform.

    Rejects tenant (staff) tokens and inactive platform accounts.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        token_data: TokenData = await security.verify_token(
            token=credentials.credentials,
            redis_client=redis,
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.info(f"Platform token verification failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    if getattr(token_data, "kind", "staff") != "platform":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Staff credentials cannot access platform APIs",
        )

    stmt = select(PlatformUser).where(PlatformUser.id == token_data.sub)
    user = (await db.exec(stmt)).first()
    if not user or not user.active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Platform account inactive or not found",
        )
    if user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Platform account inactive or not found",
        )
    return user


PlatformAuthUser = Annotated[PlatformUser, Depends(get_current_platform_user)]


def require_platform_permissions(
    *required: PlatformPermission | str,
) -> Callable:
    """Dependency factory: require all listed platform permissions or 403."""

    required_perms: List[PlatformPermission] = [
        p if isinstance(p, PlatformPermission) else PlatformPermission(str(p))
        for p in required
    ]

    async def _dep(
        request: Request,
        user: PlatformAuthUser,
        db: SessionDep,
    ) -> PlatformUser:
        if not has_all_permissions(user, required_perms):
            missing = [p.value for p in required_perms]
            await record_platform_audit(
                db,
                actor=user,
                action="platform.rbac.denied",
                outcome="denied",
                resource_type="endpoint",
                resource_id=str(request.url.path),
                meta={
                    "permissions": missing,
                    "method": request.method,
                    "role": (
                        effective_platform_role(user).value
                        if effective_platform_role(user)
                        else None
                    ),
                },
                request_id=request.headers.get("x-request-id"),
                independent=True,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "PLATFORM_RBAC_DENIED",
                    "message": "Insufficient platform permissions",
                    "permissions": missing,
                },
            )
        return user

    return _dep
