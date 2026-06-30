import os
from typing import Union
import redis
from redis.asyncio import Redis as AsyncRedis
from app.core.config import settings
from app.utils.logging import logger

class RedisManager:
    def __init__(self):
        self._client: Union[redis.Redis, None] = None
        self._async_client: Union[AsyncRedis, None] = None

    def get_async_client(self) -> AsyncRedis:
        """Returns a thread-safe, async Redis client or its mock equivalent."""
        if self._async_client is None:
            if not settings.is_prod:
                import fakeredis.aioredis as fakeredis_async
                logger.info("🚀 Using FakeRedis (In-Memory Async) for local development.")
                self._async_client = fakeredis_async.FakeRedis(decode_responses=True)
            else:
                redis_url = settings.redis_url
                self._async_client = AsyncRedis.from_url(redis_url, decode_responses=True)
        return self._async_client

    async def close(self):
        if self._async_client is not None:
            await self._async_client.close()

# Global manager instance
redis_manager = RedisManager()