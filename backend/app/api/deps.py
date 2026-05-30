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
    if current_user.role not in ["OWNER", "MANAGER", "CASHIER", "KITCHEN_STAFF"]:
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