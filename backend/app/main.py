# from contextlib import asynccontextmanager

# from fastapi import FastAPI
# from sqlalchemy import text
# from sqlmodel.ext.asyncio.session import AsyncSession
# from starlette.middleware.cors import CORSMiddleware
# from slowapi import _rate_limit_exceeded_handler
# from slowapi.errors import RateLimitExceeded
# from fastapi_cache import FastAPICache
# from fastapi_cache.backends.redis import RedisBackend

# from app.api.api_router import api_router
# from app.core.config import settings
# from app.core.session import engine
# from app.core.redis_client import redis_manager, limiter # Import slowapi limiter setup
# from app.utils.logging import logger
# from app.prestart import create_admin_tenant
# from app.utils.helpers import utc_now


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     logger.info(
#         f"Starting {settings.app_name} | "
#         f"Version: {settings.app_version} | "
#         f"Environment: {settings.environment} | "
#     )

#     # --------------------------------------------------------------
#     # 1. Database Connectivity Verification
#     # --------------------------------------------------------------
#     try:
#         async with AsyncSession(engine) as session:
#             logger.info("Verifying database connectivity...")
#             await session.exec(text("SELECT 1"))
#         logger.info("Database connectivity verified.")
#         logger.info("Checking admin account")
#         await create_admin_tenant()
#     except Exception as e:
#         logger.critical(f"Database connection failed: {str(e)}")
#         raise RuntimeError("Database unavailable. Aborting startup.") from e

#     # --------------------------------------------------------------
#     # 2. Redis State & Read/Write Readiness Verification
#     # --------------------------------------------------------------
#     try:
#         logger.info("Initializing Redis connection pool...")
#         redis_client = redis_manager.get_async_client()

#         # Actively verify connection capability by executing a full round-trip operation
#         logger.info("Verifying Redis read/write capability...")
#         test_key = f"startup:probe:{int(utc_now().timestamp())}"
#         test_value = "ready"

#         # Set a low TTL (10s) so it doesn't linger even if deletion failed
#         await redis_client.set(test_key, test_value, ex=10)
#         retrieved_value = await redis_client.get(test_key)

#         if retrieved_value is not None:
#             # If decode_responses=False, it returns bytes b'ready'
#             decoded_value = retrieved_value.decode("utf-8") if isinstance(retrieved_value, bytes) else retrieved_value
#             if decoded_value == test_value:
#                 await redis_client.delete(test_key)
#                 logger.info("Redis connectivity and read/write verified successfully.")
#             else:
#                 raise ValueError("Retrieved data did not match verification string.")
#         else:
#             raise ValueError("Redis returned None for verification key.")

#         # Initialize fastapi-cache2 using your single bytes-compatible client pool
#         logger.info("Initializing FastAPI Route Cache layer...")
#         FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")
#         logger.info("FastAPI Route Cache layer successfully wired.")
#     except Exception as e:
#         logger.critical(f"Redis integration test failed: {str(e)}")
#         raise RuntimeError("Cache layer/Redis integration unavailable. Aborting startup.") from e

#     yield

#     # --------------------------------------------------------------
#     # 3. Graceful Clean Up & Teardown
#     # --------------------------------------------------------------
#     logger.info(f"Shutting down {settings.app_name}")
#     await redis_manager.close()
#     await engine.dispose()
#     logger.info(f"{settings.app_name} shutdown complete.")


# def create_application() -> FastAPI:
#     """
#     Factory function to initialize the FastAPI app.
#     Dynamically strips documentation and redoc setups in production environments.
#     """
#     # Enforce strict production documentation visibility control
#     is_production = settings.is_prod or settings.environment.lower() == "production"

#     application = FastAPI(
#         title=settings.app_name,
#         version=settings.app_version,
#         lifespan=lifespan,
#         docs_url=None if is_production else "/docs",
#         redoc_url=None if is_production else "/redoc",
#         openapi_url=None if is_production else "/openapi.json"
#     )

#     # 1. Register Slowapi State and Core Exception Handlers
#     application.state.limiter = limiter
#     application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

#     # 2. Middleware Stack Configuration
#     logger.info(f"CORS Configurations -> Allowed Origins: {settings.cors_origins}")
#     application.add_middleware(
#         CORSMiddleware,
#         allow_origins=settings.cors_origins,
#         allow_credentials=True,
#         allow_methods=["*"],
#         allow_headers=["*"],
#     )

#     # 3. Base Application Router Inclusions
#     application.include_router(api_router)

#     # 4. Standard Health Check Endpoint
#     @application.get("/health", tags=["System Operational Infrastructure"])
#     async def health_check():
#         return {
#             "status": "healthy",
#             "app_name": settings.app_name,
#             "version": settings.app_version,
#             "environment": "Production" if is_production else "Development"
#         }

#     return application


# # Global application invocation instance
# app: FastAPI = create_application()

from contextlib import asynccontextmanager
from ipaddress import ip_address, ip_network

from fastapi import FastAPI, Request
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession
from starlette.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

from app.api.api_router import api_router
from app.core.config import settings
from app.core.session import engine
from app.core.redis_client import redis_manager, limiter
from app.utils.logging import logger
from app.prestart import create_admin_tenant
from app.utils.helpers import utc_now

# Private / internal ranges we never want to see as "client" IP
_PRIVATE_NETWORKS = [
    ip_network("10.0.0.0/8"),
    ip_network("172.16.0.0/12"),
    ip_network("192.168.0.0/16"),
    ip_network("127.0.0.0/8"),
    ip_network("::1/128"),
    ip_network("fc00::/7"),
    ip_network("fe80::/10"),
]


def _is_private_or_internal(ip_str: str | None) -> bool:
    if not ip_str:
        return True
    try:
        addr = ip_address(ip_str.strip())
        return any(addr in net for net in _PRIVATE_NETWORKS)
    except ValueError:
        return True


def _extract_client_ip(request: Request) -> dict:
    """Pull the most useful IP-related headers in one place."""
    client_host = request.client.host if request.client else None
    return {
        "client_host": client_host,
        "cf_connecting_ip": request.headers.get("cf-connecting-ip"),
        "x_real_ip": request.headers.get("x-real-ip"),
        "x_forwarded_for": request.headers.get("x-forwarded-for"),
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        f"Starting {settings.app_name} | "
        f"Version: {settings.app_version} | "
        f"Environment: {settings.environment} | "
    )

    # --------------------------------------------------------------
    # 1. Database Connectivity Verification
    # --------------------------------------------------------------
    try:
        async with AsyncSession(engine) as session:
            logger.info("Verifying database connectivity...")
            await session.exec(text("SELECT 1"))
        logger.info("Database connectivity verified.")
        logger.info("Checking admin account")
        await create_admin_tenant()
    except Exception as e:
        logger.critical(f"Database connection failed: {str(e)}")
        raise RuntimeError("Database unavailable. Aborting startup.") from e

    # --------------------------------------------------------------
    # 2. Redis State & Read/Write Readiness Verification
    # --------------------------------------------------------------
    try:
        logger.info("Initializing Redis connection pool...")
        redis_client = redis_manager.get_async_client()

        logger.info("Verifying Redis read/write capability...")
        test_key = f"startup:probe:{int(utc_now().timestamp())}"
        test_value = "ready"

        await redis_client.set(test_key, test_value, ex=10)
        retrieved_value = await redis_client.get(test_key)

        if retrieved_value is not None:
            decoded_value = (
                retrieved_value.decode("utf-8")
                if isinstance(retrieved_value, bytes)
                else retrieved_value
            )
            if decoded_value == test_value:
                await redis_client.delete(test_key)
                logger.info("Redis connectivity and read/write verified successfully.")
            else:
                raise ValueError("Retrieved data did not match verification string.")
        else:
            raise ValueError("Redis returned None for verification key.")

        logger.info("Initializing FastAPI Route Cache layer...")
        FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")
        logger.info("FastAPI Route Cache layer successfully wired.")
    except Exception as e:
        logger.critical(f"Redis integration test failed: {str(e)}")
        raise RuntimeError(
            "Cache layer/Redis integration unavailable. Aborting startup."
        ) from e

    yield

    # --------------------------------------------------------------
    # 3. Graceful Clean Up & Teardown
    # --------------------------------------------------------------
    logger.info(f"Shutting down {settings.app_name}")
    await redis_manager.close()
    await engine.dispose()
    logger.info(f"{settings.app_name} shutdown complete.")


def create_application() -> FastAPI:
    """
    Factory function to initialize the FastAPI app.
    Dynamically strips documentation and redoc setups in production environments.
    """
    is_production = settings.is_prod or settings.environment.lower() == "production"

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
        docs_url=None if is_production else "/docs",
        redoc_url=None if is_production else "/redoc",
        openapi_url=None if is_production else "/openapi.json",
    )

    # 1. Register Slowapi State and Core Exception Handlers
    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # 2. Middleware Stack Configuration
    logger.info(f"CORS Configurations -> Allowed Origins: {settings.cors_origins}")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Plan validity gate (Redis-first). Feature limits enforced in route deps.

    # 3. Request IP logging middleware (runs on every request)
    @application.middleware("http")
    async def log_client_ip(request: Request, call_next):
        ips = _extract_client_ip(request)

        # Prefer the most trustworthy source for the warning check
        candidate = (
            ips["cf_connecting_ip"]
            or ips["x_real_ip"]
            or (
                ips["x_forwarded_for"].split(",")[0].strip()
                if ips["x_forwarded_for"]
                else None
            )
            or ips["client_host"]
        )

        if _is_private_or_internal(candidate):
            logger.warning(
                f"INTERNAL/CLUSTER IP DETECTED | "
                f"{request.method} {request.url.path} | "
                f"candidate={candidate} | "
                f"client_host={ips['client_host']} | "
                f"cf={ips['cf_connecting_ip']} | "
                f"xri={ips['x_real_ip']} | "
                f"xff={ips['x_forwarded_for']}"
            )
        else:
            logger.info(
                f"REQ {request.method} {request.url.path} | "
                f"client={ips['client_host']} | "
                f"cf={ips['cf_connecting_ip']} | "
                f"xri={ips['x_real_ip']} | "
                f"xff={ips['x_forwarded_for']}"
            )

        response = await call_next(request)
        return response

    # 4. Base Application Router Inclusions
    application.include_router(api_router)

    # 5. Standard Health Check Endpoint
    @application.get("/health", tags=["System Operational Infrastructure"])
    async def health_check():
        return {
            "status": "healthy",
            "app_name": settings.app_name,
            "version": settings.app_version,
            "environment": "Production" if is_production else "Development",
        }

    # 6. Temporary IP debug endpoint (remove after you confirm real IP works)
    @application.get("/debug-ip", tags=["System Operational Infrastructure"])
    async def debug_ip(request: Request):
        ips = _extract_client_ip(request)

        candidate = (
            ips["cf_connecting_ip"]
            or ips["x_real_ip"]
            or (
                ips["x_forwarded_for"].split(",")[0].strip()
                if ips["x_forwarded_for"]
                else None
            )
            or ips["client_host"]
        )

        is_internal = _is_private_or_internal(candidate)

        if is_internal:
            logger.warning(
                f"DEBUG-IP called with INTERNAL IP | candidate={candidate} | full={ips}"
            )
        else:
            logger.info(f"DEBUG-IP | real client IP looks good → {candidate}")

        return {
            **ips,
            "candidate_ip": candidate,
            "is_private_or_internal": is_internal,
            "warning": (
                "IP looks like a cluster/private address – real-IP middleware is probably not working yet"
                if is_internal
                else None
            ),
        }

    return application


# Global application invocation instance
app: FastAPI = create_application()
