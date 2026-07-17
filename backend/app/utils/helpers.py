import re
from datetime import datetime, timezone
from typing import Optional
from fastapi import Request
from app.utils.logging import logger


def utc_now() -> datetime:
    """Return current UTC time as a timezone-aware datetime."""
    return datetime.now(timezone.utc)


def utc_today() -> datetime:
    """Return today's date in UTC (00:00:00)."""
    now = utc_now()
    return datetime(year=now.year, month=now.month, day=now.day, tzinfo=timezone.utc)


def validate_and_format_kenyan_phone(phone: str, format: bool = False) -> Optional[str]:
    """
    Validates a Kenyan phone number (07xx or 01xx, 10 digits total).
    Accepts local format (07... / 01...) and international (+254... / 254...).

    Args:
        phone: The phone number string
        format: If True → returns international format (+2547xx...) if valid
                If False → returns the original cleaned string if valid

    Returns:
        str: formatted/validated phone number if valid
        None: if invalid
    """
    if not phone:
        return None

    # Remove whitespace, dashes, parentheses, etc.
    cleaned = re.sub(r"[\s\-\_\(\)]", "", phone.strip())

    # Pattern: optional +254 / 0 prefix + exactly 9 digits starting with 7 or 1
    pattern = r"^(\+254|0)?(7[0-9]{8}|1[0-9]{8})$"

    match = re.match(pattern, cleaned)
    if not match:
        return None

    # The actual 9-digit part (after prefix)
    digits = match.group(2)

    if format:
        # Return international format
        return f"254{digits}"
    else:
        # Return cleaned local format (with 0 prefix)
        return f"0{digits}"


# # Caching
# def universal_key_builder(func, namespace: str = "", *, request: Request = None, **kwargs):
#     """
#     A generic key builder that scales across all routes (products, categories, orders, etc.)
#     Example key format: fastapi-cache:products:business_id=uuid:skip=0:limit=50
#     """
#     prefix = f"{FastAPICache.get_prefix()}:{namespace}"
    
#     # 1. Extract standard query/path arguments passed to the endpoint function
#     func_kwargs = kwargs.get("kwargs", {})
    
#     # Filter out parameters we don't want part of the cache key (like database sessions or requests)
#     filtered_args = {
#         k: str(v) for k, v in func_kwargs.items() 
#         if k not in ("db", "request", "redis_client", "response") and v is not None
#     }
    
#     # 2. Sort the arguments so 'skip=0&limit=50' and 'limit=50&skip=0' generate the exact same cache key
#     sorted_args_str = ":".join(f"{k}={v}" for k, v in sorted(filtered_args.items()))
    
#     # 3. Construct the clean, predictable key
#     if sorted_args_str:
#         return f"{prefix}:{sorted_args_str}"
    
#     # Fallback if the route has absolutely zero parameters
#     return f"{prefix}:{func.__name__}"


# async def purge_cache_namespace(redis_client: AsyncRedis, namespace: str, **identifiers):
#     """
#     Purges targeted cache matrices cleanly across any namespace.
#     Usage: await purge_cache_namespace(redis_client, "products", business_id=business_id)
#     """
#     try:
#         # Reconstruct the exact string prefix based on the identifier changed
#         for key, value in identifiers.items():
#             # Targets paths that match the exact identifier signature
#             scan_pattern = f"fastapi-cache:{namespace}:*{key}={value}*"
            
#             async for match_key in redis_client.scan_iter(match=scan_pattern):
#                 await redis_client.delete(match_key)
                
#         logger.info(f"Evicted stale entries for namespace: {namespace}")
#     except Exception as e:
#         logger.error(f"Cache eviction failed: {str(e)}")


# @router.get("/list/{tenant_id}")
# @cache(expire=300, namespace="categories", key_builder=universal_key_builder)
# async def get_categories(request: Request, db: SessionDep, tenant_id: UUID):
#     # Generates: fastapi-cache:categories:tenant_id=<uuid>
#     ...