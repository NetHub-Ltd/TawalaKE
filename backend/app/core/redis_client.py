import os
from typing import Optional
from redis.asyncio import Redis as AsyncRedis
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.utils.logging import logger

class RedisManager:
    def __init__(self) -> None:
        self._async_client: Optional[AsyncRedis] = None

    def get_async_client(self) -> AsyncRedis:
        """
        Returns a lazy-initialized asynchronous Redis client using the configured connection URL.
        Configures an optimal connection pool for both dev and production instances.
        """
        if self._async_client is None:
            if not settings.redis_url:
                logger.error("❌ Redis configuration error: REDIS_URL environment variable is missing.")
                raise ValueError("REDIS_URL must be set to initialize RedisManager.")

            logger.info(f"🚀 Initializing AsyncRedis connection pool (Is Prod: {settings.is_prod}).")
            
            # Using from_url cleanly parses schemes, passwords, and hosts.
            # Upstash clusters handle connections best when we let the pool manage them.
            self._async_client = AsyncRedis.from_url(
                settings.redis_url, 
                max_connections=20,
                # Prevents hangs during transient cloud network hiccups
                socket_timeout=5.0,
                socket_connect_timeout=5.0
            )
            
        return self._async_client

    async def close(self) -> None:
        """
        Gracefully tears down the connection pool during application shutdown.
        """
        if self._async_client is not None:
            await self._async_client.close()
            logger.info("[RedisManager] Async client connection pool cleanly closed.")
            self._async_client = None

redis_manager = RedisManager()

# Use the same live Redis instance for Slowapi in all environments to ensure parity.
# Fall back gracefully to memory ONLY if no URL is present (e.g., during isolated unit tests).
# limiter_storage = settings.redis_url if settings.redis_url else "memory://"

# limiter = Limiter(
#     key_func=get_remote_address,
#     storage_uri=limiter_storage,
#     storage_options={"KEY_PREFIX": "nethub:ratelimit"} 
# )

limiter_storage = settings.redis_url if settings.redis_url else "memory://"

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=limiter_storage,
    key_prefix="tawala:ratelimit",  # <-- Pass as key_prefix kwarg, remove storage_options
)