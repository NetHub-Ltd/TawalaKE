from typing import AsyncGenerator, Annotated
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from loguru import logger
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import verify_token, TokenData
from app.core.session import AsyncSessionLocal
from app.utils.logging import logger
from app.core.security import oauth2_scheme
from app.models.models import Staff
from sqlmodel import select
from redis.asyncio.client import Redis as AsyncRedis
from app.core.redis_client import redis_manager


from fastapi import Request
from fastapi_cache import FastAPICache

from app.core.redis_client import redis_manager
from app.utils.logging import logger


async def get_redis() -> AsyncRedis:
    """
    Dependency provider for the asynchronous Redis client instance.
    Fixes type wrapping structures to ensure clean injection trees.
    """
    # Stripped trailing comma to prevent explicit tuple conversion
    return redis_manager.get_async_client()


def universal_key_builder(func, namespace: str = "", *, request: Request = None, **kwargs):
    """
    A generic key builder that scales across all routes (products, categories, orders, etc.)
    Example key format: fastapi-cache:products:business_id=uuid:skip=0:limit=50
    """
    prefix = f"{FastAPICache.get_prefix()}:{namespace}"
    
    # 1. Extract standard query/path arguments passed to the endpoint function
    func_kwargs = kwargs.get("kwargs", {})
    
    # Filter out parameters we don't want part of the cache key
    filtered_args = {
        k: str(v) for k, v in func_kwargs.items() 
        if k not in ("db", "request", "redis_client", "response") and v is not None
    }
    
    # 2. Sort the arguments so order variations generate the exact same cache key
    sorted_args_str = ":".join(f"{k}={v}" for k, v in sorted(filtered_args.items()))
    
    # 3. Construct the clean, predictable key
    if sorted_args_str:
        return f"{prefix}:{sorted_args_str}"
    
    # Fallback if the route has absolutely zero parameters
    return f"{prefix}:{func.__name__}"


async def purge_cache_namespace(redis_client: AsyncRedis, namespace: str, **identifiers):
    """
    Purges targeted cache matrices cleanly across any namespace.
    Usage: await purge_cache_namespace(redis_client, "products", business_id=business_id)
    """
    try:
        # Reconstruct the exact string prefix based on the identifier changed
        for key, value in identifiers.items():
            # Targets paths that match the exact identifier signature
            scan_pattern = f"fastapi-cache:{namespace}:*{key}={value}*"
            
            async for match_key in redis_client.scan_iter(match=scan_pattern):
                await redis_client.delete(match_key)
                
        logger.info(f"Evicted stale entries for namespace: {namespace}")
    except Exception as e:
        logger.error(f"Cache eviction failed: {str(e)}")


# ------------------------------------------------------------------
# Database Session
# ------------------------------------------------------------------
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Provides a scoped AsyncSession for each request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except SQLAlchemyError as e:
            await session.rollback()
            logger.error(f"DB Session Error: {str(e)}")
            raise


# ------------------------------------------------------------------
# HTTP Bearer Token (Local JWT)
# ------------------------------------------------------------------
# bearer_scheme = HTTPBearer(auto_error=False)
SessionDep = Annotated[AsyncSession, Depends(get_session)]

async def get_current_user(db: AsyncSession = Depends(get_session),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(oauth2_scheme),
) -> TokenData:
    """
    Validates JWT token locally (no more external Keycloak/Resource Server call).
    Works with both normal login and PIN login tokens.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials

    try:
        # This uses our local security.py
        token_data: TokenData = verify_token(token)
        stmt = select(Staff).where(Staff.id == token_data.sub)
        staff = (await db.exec(stmt)).first()
        if not staff or not staff.active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return staff

    except HTTPException as e:
        # Re-raise auth errors from verify_token
        raise e
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_staff(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """Restrict to staff roles (Owner, Manager, Cashier, etc.)"""
    if current_user.role not in ["OWNER", "MANAGER", "CASHIER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_user


# ------------------------------------------------------------------
# Type Annotations for easy use
# ------------------------------------------------------------------
AuthUser = Annotated[TokenData, Depends(get_current_user)]
CurrentStaff = Annotated[TokenData, Depends(get_current_staff)]