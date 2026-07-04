import os
from typing import Optional
import redis
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
        Returns a thread-safe, async Redis client for application business caching.
        Uses fakeredis locally to bypass requiring a running instance.
        """
        if self._async_client is None:
            if not settings.is_prod:
                import fakeredis.aioredis as fakeredis_async
                logger.info("🚀 Using FakeRedis (In-Memory Async) for local application caching.")
                # decode_responses=True ensures we handle strings rather than raw bytes
                self._async_client = fakeredis_async.FakeRedis(decode_responses=True)
            else:
                self._async_client = AsyncRedis.from_url(
                    settings.redis_url, 
                    decode_responses=True,
                    max_connections=20 # Set a protective production connection limit
                )
        return self._async_client

    async def close(self) -> None:
        if self._async_client is not None:
            await self._async_client.close()
            logger.info("[RedisManager] Async client connection pool cleanly closed.")

# Instantiate global manager
redis_manager = RedisManager()


# ==========================================
# 2. SLOWAPI RATE LIMITER CONFIGURATION
# ==========================================

# Resolve the backend URI for slowapi. 
# If local, use the native in-memory mock scheme so slowapi doesn't seek a live socket on 6379.
if not settings.is_prod:
    # slowapi uses standard redis backend strings under the hood
    slowapi_storage_uri = "redis://localhost:6379/0" 
    # To prevent slowapi from throwing ConnectionError locally, we fake the fallback to memory:
    limiter_storage = "memory://" 
else:
    limiter_storage = settings.redis_url


limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=limiter_storage,
    # Pass engine-specific configs under storage_options
    storage_options={"KEY_PREFIX": "nethub:ratelimit"} 
)